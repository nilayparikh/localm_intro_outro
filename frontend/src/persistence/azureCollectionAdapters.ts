import type { CachedCrudRecord, RemoteCrudAdapter } from "@common";
import type { StoredAuthState } from "../auth";
import {
  deleteRemoteDocument,
  ensureTableExists,
  getTableClient,
  toRemoteEntity,
} from "../sync/azureTableSync";

interface AzureTableCrudClientLike {
  listEntities: ReturnType<typeof getTableClient>["listEntities"];
  upsertEntity: ReturnType<typeof getTableClient>["upsertEntity"];
  deleteEntity: ReturnType<typeof getTableClient>["deleteEntity"];
}

export function createAzureTableCrudAdapter<TRecord extends CachedCrudRecord>(
  partitionKey: string,
  authState: StoredAuthState,
  options: {
    ensureTable?: () => Promise<void>;
    createClient?: (
      authState: StoredAuthState,
    ) => Promise<AzureTableCrudClientLike> | AzureTableCrudClientLike;
  } = {},
): RemoteCrudAdapter<TRecord> {
  const ensureTable =
    options.ensureTable ?? (() => ensureTableExists(authState));
  const createClient = options.createClient ?? getTableClient;

  return {
    list: async () => {
      const client = await createClient(authState);
      const records: TRecord[] = [];
      const entities = client.listEntities({
        queryOptions: { filter: `PartitionKey eq '${partitionKey}'` },
      });

      for await (const entity of entities) {
        const doc = JSON.parse(String(entity.data ?? "{}"));
        records.push({
          ...doc,
          updatedAt: Number(entity.updatedAt ?? doc.updatedAt ?? 0),
        } as TRecord);
      }

      return records;
    },
    upsert: async (record: TRecord) => {
      await ensureTable();
      const client = await createClient(authState);
      await client.upsertEntity(
        toRemoteEntity(partitionKey, record, authState),
        "Replace",
      );
      return record;
    },
    delete: async (id: string) => {
      await deleteRemoteDocument(partitionKey, id, authState, {
        ensureTable,
        createClient,
      });
    },
  };
}
