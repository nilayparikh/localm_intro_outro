import {
  TableClient,
  TableServiceClient,
  AzureSASCredential,
} from "@azure/data-tables";
import { firstValueFrom, merge } from "rxjs";
import { map, take } from "rxjs/operators";
import { resolveStorageAuth, type StoredAuthState } from "../auth";
import type { BannersDatabase } from "../db";
import { extractBlobPath } from "../services/blobStorage";

interface SyncCheckpoint {
  updatedAt: number;
  id: string;
}

interface TableClientConfig {
  endpoint: string;
  tableName: string;
}

interface TableServiceClientLike {
  createTable: (tableName: string) => Promise<unknown>;
}

interface TableClientLike {
  listEntities: TableClient["listEntities"];
  upsertEntity: TableClient["upsertEntity"];
  deleteEntity: (partitionKey: string, rowKey: string) => Promise<unknown>;
}

type UpsertRemoteClientLike = Pick<TableClientLike, "upsertEntity">;
type DeleteRemoteClientLike = Pick<TableClientLike, "deleteEntity">;

export type SyncableCollectionName =
  | "settings"
  | "presets"
  | "banners"
  | "themes"
  | "app_state";

export const SYNCABLE_COLLECTIONS: SyncableCollectionName[] = [
  "settings",
  "presets",
  "banners",
  "themes",
  "app_state",
];

interface ReplicationLike {
  awaitInSync: () => Promise<true>;
  error$: {
    pipe: typeof merge extends (...args: any[]) => infer _ ? any : never;
  };
}

const SYNCED_ASSET_FIELDS = new Set([
  "brandLogoUrl",
  "tutorialImageUrl",
  "logo_url",
]);
const MAX_REMOTE_ENTITY_DATA_BYTES = 60 * 1024;
const ensuredTables = new Set<string>();
const ensuredTablePromises = new Map<string, Promise<void>>();

export function buildTableClientConfig(
  connection: StoredAuthState["connection"],
): TableClientConfig {
  return {
    endpoint: connection.tableEndpoint.replace(/\/+$/, ""),
    tableName: connection.tableName,
  };
}

export async function awaitReplicationsInSync(
  replications: ReplicationLike[],
): Promise<void> {
  const inSyncPromise = Promise.all(
    replications.map((replication) => replication.awaitInSync()),
  );
  const errorStreams = replications.map((replication) =>
    replication.error$.pipe(
      take(1),
      map((error: Error) => {
        throw new Error(`Sync failed: ${error.message}`);
      }),
    ),
  );

  if (errorStreams.length === 0) {
    await inSyncPromise;
    return;
  }

  await Promise.race([inSyncPromise, firstValueFrom(merge(...errorStreams))]);
}

export function getTableClient(authState: StoredAuthState): TableClientLike {
  const auth = resolveStorageAuth(authState);
  const clientConfig = buildTableClientConfig(auth.connection);

  if (auth.kind === "sas") {
    return new TableClient(
      clientConfig.endpoint,
      clientConfig.tableName,
      new AzureSASCredential(auth.sasToken),
    );
  }

  return new TableClient(clientConfig.endpoint, clientConfig.tableName, {
    getToken: async () => ({
      token: auth.accessToken,
      expiresOnTimestamp: Date.now() + 60 * 60 * 1000,
    }),
  });
}

function getTableServiceClient(
  authState: StoredAuthState,
): TableServiceClientLike {
  const auth = resolveStorageAuth(authState);
  const clientConfig = buildTableClientConfig(auth.connection);

  if (auth.kind === "sas") {
    return new TableServiceClient(
      clientConfig.endpoint,
      new AzureSASCredential(auth.sasToken),
    );
  }

  return new TableServiceClient(clientConfig.endpoint, {
    getToken: async () => ({
      token: auth.accessToken,
      expiresOnTimestamp: Date.now() + 60 * 60 * 1000,
    }),
  });
}

function isTableAlreadyExistsError(error: unknown): boolean {
  const candidate = error as { statusCode?: number; code?: string };
  return (
    candidate?.statusCode === 409 || candidate?.code === "TableAlreadyExists"
  );
}

function isEntityNotFoundError(error: unknown): boolean {
  const candidate = error as { statusCode?: number; code?: string };
  return (
    candidate?.statusCode === 404 ||
    candidate?.code === "ResourceNotFound" ||
    candidate?.code === "EntityNotFound"
  );
}

export async function ensureTableExists(
  authState: StoredAuthState,
  createClient: (
    authState: StoredAuthState,
  ) =>
    | Promise<TableServiceClientLike>
    | TableServiceClientLike = getTableServiceClient,
): Promise<void> {
  const { endpoint, tableName } = buildTableClientConfig(authState.connection);
  const ensuredTableKey = `${endpoint}|${tableName}`;
  if (ensuredTables.has(ensuredTableKey)) {
    return;
  }

  const existingPromise = ensuredTablePromises.get(ensuredTableKey);
  if (existingPromise) {
    await existingPromise;
    return;
  }

  const ensurePromise = (async () => {
    const client = await createClient(authState);

    try {
      await client.createTable(tableName);
      ensuredTables.add(ensuredTableKey);
    } catch (error) {
      if (!isTableAlreadyExistsError(error)) {
        throw error;
      }

      ensuredTables.add(ensuredTableKey);
    }
  })();

  ensuredTablePromises.set(ensuredTableKey, ensurePromise);
  try {
    await ensurePromise;
  } finally {
    ensuredTablePromises.delete(ensuredTableKey);
  }
}

function sanitizeRemoteAssetReference(
  value: string,
  authState: StoredAuthState,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return null;
  }

  return extractBlobPath(value, authState) ?? null;
}

function sanitizeRemoteDocument(
  value: unknown,
  authState: StoredAuthState,
  fieldName?: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeRemoteDocument(entry, authState));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sanitizeRemoteDocument(entry, authState, key),
      ]),
    );
  }

  if (
    typeof value === "string" &&
    fieldName &&
    SYNCED_ASSET_FIELDS.has(fieldName)
  ) {
    return sanitizeRemoteAssetReference(value, authState);
  }

  return value;
}

export function toRemoteEntity(
  partitionKey: string,
  doc: any,
  authState: StoredAuthState,
) {
  const sanitizedDoc = sanitizeRemoteDocument(doc, authState);
  const data = JSON.stringify(sanitizedDoc);

  if (new TextEncoder().encode(data).length > MAX_REMOTE_ENTITY_DATA_BYTES) {
    throw new Error(
      `Document \"${partitionKey}/${doc.id}\" is too large for Azure Table sync. Upload image assets to Azure Blob Storage or reduce the draft payload before syncing.`,
    );
  }

  return {
    partitionKey,
    rowKey: doc.id,
    data,
    updatedAt: doc.updatedAt,
  };
}

async function getRemoteDocuments(
  partitionKey: string,
  authState: StoredAuthState,
): Promise<Map<string, any>> {
  const client = getTableClient(authState);
  const docs = new Map<string, any>();
  const entities = client.listEntities({
    queryOptions: { filter: `PartitionKey eq '${partitionKey}'` },
  });

  for await (const entity of entities) {
    const doc = JSON.parse(String(entity.data ?? "{}"));
    docs.set(String(entity.rowKey), {
      ...doc,
      updatedAt: Number(entity.updatedAt ?? doc.updatedAt ?? 0),
    });
  }

  return docs;
}

async function deleteLocalDocumentsMissingRemotely(
  collection: any,
  remoteDocs: Map<string, any>,
): Promise<void> {
  const localDocs = await collection.find().exec();
  const remoteIds = new Set(remoteDocs.keys());

  await Promise.all(
    localDocs
      .filter((doc: any) => !remoteIds.has(doc.toJSON().id))
      .map((doc: any) => doc.remove()),
  );
}

export async function deleteRemoteDocumentsMissingLocally(
  partitionKey: string,
  localDocs: Map<string, any>,
  remoteDocs: Map<string, any>,
  authState: StoredAuthState,
  createClient: (
    authState: StoredAuthState,
  ) =>
    | Promise<Pick<TableClientLike, "deleteEntity">>
    | Pick<TableClientLike, "deleteEntity"> = getTableClient,
): Promise<void> {
  const deletedIds = [...remoteDocs.keys()].filter((id) => !localDocs.has(id));
  if (deletedIds.length === 0) {
    return;
  }

  const client = await createClient(authState);

  for (const id of deletedIds) {
    await client.deleteEntity(partitionKey, id);
    remoteDocs.delete(id);
  }
}

export async function upsertRemoteDocument(
  partitionKey: string,
  doc: any,
  authState: StoredAuthState,
  options: {
    ensureTable?: () => Promise<void>;
    createClient?: (
      authState: StoredAuthState,
    ) => Promise<UpsertRemoteClientLike> | UpsertRemoteClientLike;
  } = {},
): Promise<void> {
  const ensureTable =
    options.ensureTable ?? (() => ensureTableExists(authState));
  const createClient = options.createClient ?? getTableClient;

  await ensureTable();
  const client = await createClient(authState);
  await client.upsertEntity(
    toRemoteEntity(partitionKey, doc, authState),
    "Replace",
  );
}

export async function deleteRemoteDocument(
  partitionKey: string,
  rowKey: string,
  authState: StoredAuthState,
  options: {
    ensureTable?: () => Promise<void>;
    createClient?: (
      authState: StoredAuthState,
    ) => Promise<DeleteRemoteClientLike> | DeleteRemoteClientLike;
  } = {},
): Promise<void> {
  const ensureTable =
    options.ensureTable ?? (() => ensureTableExists(authState));
  const createClient = options.createClient ?? getTableClient;

  await ensureTable();
  const client = await createClient(authState);

  try {
    await client.deleteEntity(partitionKey, rowKey);
  } catch (error) {
    if (!isEntityNotFoundError(error)) {
      throw error;
    }
  }
}

export async function refreshCollectionsFromAzure(
  db: BannersDatabase,
  authState: StoredAuthState,
  options: {
    collectionNames?: readonly SyncableCollectionName[];
    ensureTableExistsFn?: (authState: StoredAuthState) => Promise<void>;
    getRemoteDocumentsFn?: (
      partitionKey: string,
      authState: StoredAuthState,
    ) => Promise<Map<string, any>>;
    pullRemoteDocumentsFn?: (
      collection: any,
      remoteDocs: Map<string, any>,
    ) => Promise<void>;
    deleteLocalDocumentsMissingRemotelyFn?: (
      collection: any,
      remoteDocs: Map<string, any>,
    ) => Promise<void>;
  } = {},
): Promise<void> {
  const collectionNames = options.collectionNames ?? SYNCABLE_COLLECTIONS;
  const ensureTableExistsFn = options.ensureTableExistsFn ?? ensureTableExists;
  const getRemoteDocumentsFn =
    options.getRemoteDocumentsFn ?? getRemoteDocuments;
  const pullRemoteDocumentsFn =
    options.pullRemoteDocumentsFn ?? pullRemoteDocuments;
  const deleteLocalDocumentsMissingRemotelyFn =
    options.deleteLocalDocumentsMissingRemotelyFn ??
    deleteLocalDocumentsMissingRemotely;

  await ensureTableExistsFn(authState);

  for (const name of collectionNames) {
    const collection = db[name];
    const remoteDocs = await getRemoteDocumentsFn(name, authState);
    await pullRemoteDocumentsFn(collection, remoteDocs);
    await deleteLocalDocumentsMissingRemotelyFn(collection, remoteDocs);
  }
}

async function pushLocalDocuments(
  partitionKey: string,
  localDocs: Map<string, any>,
  remoteDocs: Map<string, any>,
  authState: StoredAuthState,
): Promise<void> {
  const client = getTableClient(authState);

  for (const [id, doc] of localDocs) {
    const remoteDoc = remoteDocs.get(id);
    if (
      !remoteDoc ||
      Number(doc.updatedAt ?? 0) >= Number(remoteDoc.updatedAt ?? 0)
    ) {
      await client.upsertEntity(
        toRemoteEntity(partitionKey, doc, authState),
        "Replace",
      );
    }
  }
}

async function pullRemoteDocuments(
  collection: any,
  remoteDocs: Map<string, any>,
): Promise<void> {
  const localDocs = await collection.find().exec();
  const localDocMap = new Map<string, any>(
    localDocs.map((doc: any) => {
      const json = doc.toJSON();
      return [json.id, json];
    }),
  );

  for (const [id, remoteDoc] of remoteDocs) {
    const localDoc = localDocMap.get(id);
    if (
      !localDoc ||
      Number(remoteDoc.updatedAt ?? 0) > Number(localDoc.updatedAt ?? 0)
    ) {
      await collection.upsert(remoteDoc);
    }
  }
}

export async function syncDatabaseOnce(
  db: BannersDatabase,
  authState: StoredAuthState,
  options: {
    collectionNames?: readonly SyncableCollectionName[];
    ensureTableExistsFn?: (authState: StoredAuthState) => Promise<void>;
    getRemoteDocumentsFn?: (
      partitionKey: string,
      authState: StoredAuthState,
    ) => Promise<Map<string, any>>;
    deleteRemoteDocumentsMissingLocallyFn?: (
      partitionKey: string,
      localDocs: Map<string, any>,
      remoteDocs: Map<string, any>,
      authState: StoredAuthState,
    ) => Promise<void>;
    pushLocalDocumentsFn?: (
      partitionKey: string,
      localDocs: Map<string, any>,
      remoteDocs: Map<string, any>,
      authState: StoredAuthState,
    ) => Promise<void>;
    pullRemoteDocumentsFn?: (
      collection: any,
      remoteDocs: Map<string, any>,
    ) => Promise<void>;
  } = {},
): Promise<void> {
  const ensureTableExistsFn = options.ensureTableExistsFn ?? ensureTableExists;
  const getRemoteDocumentsFn =
    options.getRemoteDocumentsFn ?? getRemoteDocuments;
  const pushLocalDocumentsFn =
    options.pushLocalDocumentsFn ?? pushLocalDocuments;
  const pullRemoteDocumentsFn =
    options.pullRemoteDocumentsFn ?? pullRemoteDocuments;
  const collectionNames = options.collectionNames ?? SYNCABLE_COLLECTIONS;

  await ensureTableExistsFn(authState);

  for (const name of collectionNames) {
    const collection = db[name];
    const localDocs = await collection.find().exec();
    const localDocMap = new Map<string, any>(
      localDocs.map((doc: any) => {
        const json = doc.toJSON();
        return [json.id, json];
      }),
    );

    const remoteDocs = await getRemoteDocumentsFn(name, authState);
    await pushLocalDocumentsFn(name, localDocMap, remoteDocs, authState);
    await pullRemoteDocumentsFn(collection, remoteDocs);
  }
}

export function createPullHandler(
  partitionKey: string,
  authState: StoredAuthState,
) {
  return async function pullHandler(
    checkpoint: SyncCheckpoint | undefined,
    batchSize: number,
  ): Promise<{ documents: any[]; checkpoint: SyncCheckpoint }> {
    const client = getTableClient(authState);
    const lastUpdatedAt = checkpoint?.updatedAt ?? 0;

    const documents: any[] = [];
    let latestCheckpoint: SyncCheckpoint = checkpoint ?? {
      updatedAt: 0,
      id: "",
    };

    const query = `PartitionKey eq '${partitionKey}' and updatedAt gt ${lastUpdatedAt}`;
    const entities = client.listEntities({
      queryOptions: { filter: query },
    });

    let count = 0;
    for await (const entity of entities) {
      if (count >= batchSize) break;
      const doc = JSON.parse(entity.data as string);
      documents.push(doc);

      const entityUpdatedAt = entity.updatedAt as number;
      if (entityUpdatedAt > latestCheckpoint.updatedAt) {
        latestCheckpoint = { updatedAt: entityUpdatedAt, id: doc.id };
      }
      count++;
    }

    return { documents, checkpoint: latestCheckpoint };
  };
}

export function createPushHandler(
  partitionKey: string,
  authState: StoredAuthState,
) {
  return async function pushHandler(rows: any[]): Promise<any[]> {
    const client = getTableClient(authState);
    const conflicts: any[] = [];

    for (const row of rows) {
      const doc = row.newDocumentState;
      try {
        await client.upsertEntity(
          toRemoteEntity(partitionKey, doc, authState),
          "Merge",
        );
      } catch (err: any) {
        if (err?.statusCode === 409) {
          conflicts.push(doc);
        } else {
          throw err;
        }
      }
    }

    return conflicts;
  };
}
