import test from "node:test";
import assert from "node:assert/strict";
import { Subject } from "rxjs";
import {
  buildTableClientConfig,
  ensureTableExists,
  awaitReplicationsInSync,
  deleteRemoteDocumentsMissingLocally,
  refreshCollectionsFromAzure,
  SYNCABLE_COLLECTIONS,
  toRemoteEntity,
  upsertRemoteDocument,
  deleteRemoteDocument,
  syncDatabaseOnce,
} from "../../src/sync/azureTableSync";
import { createAzureTableCrudAdapter } from "../../src/persistence/azureCollectionAdapters";

test("azure sync includes dynamic themes alongside other replicated collections", () => {
  assert.deepEqual(SYNCABLE_COLLECTIONS, [
    "settings",
    "presets",
    "banners",
    "themes",
    "app_state",
  ]);
});

test("buildTableClientConfig keeps the service endpoint separate from table name", () => {
  const config = buildTableClientConfig({
    profile: "Dev",
    storageAccountName: "satutslocalm",
    tableEndpoint: "https://satutslocalm.table.core.windows.net/",
    tableName: "BannersDev",
    blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
    blobContainerName: "banner",
  });

  assert.equal(config.endpoint, "https://satutslocalm.table.core.windows.net");
  assert.equal(config.tableName, "BannersDev");
});

test("awaitReplicationsInSync rejects when a replication emits an error", async () => {
  const error$ = new Subject<Error>();
  const promise = awaitReplicationsInSync([
    {
      awaitInSync: () => new Promise<true>(() => undefined),
      error$,
    },
  ]);

  queueMicrotask(() => {
    error$.next(new Error("boom"));
  });

  await assert.rejects(() => promise, /sync failed/i);
});

test("ensureTableExists provisions the configured table and ignores conflicts", async () => {
  const createdTables: string[] = [];

  await ensureTableExists(
    {
      mode: "sas-token",
      sasToken: "sv=2025-01-05&sig=test",
      connection: {
        profile: "Dev",
        storageAccountName: "satutslocalm",
        tableEndpoint: "https://satutslocalm.table.core.windows.net/",
        tableName: "BannersDev",
        blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
        blobContainerName: "banner",
      },
    },
    async () => ({
      createTable: async (tableName: string) => {
        createdTables.push(tableName);
      },
    }),
  );

  assert.deepEqual(createdTables, ["BannersDev"]);

  await assert.doesNotReject(async () => {
    await ensureTableExists(
      {
        mode: "sas-token",
        sasToken: "sv=2025-01-05&sig=test",
        connection: {
          profile: "Prod",
          storageAccountName: "satutslocalm",
          tableEndpoint: "https://satutslocalm.table.core.windows.net/",
          tableName: "BannersProd",
          blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
          blobContainerName: "banner",
        },
      },
      async () => ({
        createTable: async () => {
          const error = Object.assign(new Error("exists"), {
            statusCode: 409,
          });
          throw error;
        },
      }),
    );
  });
});

test("ensureTableExists caches tables that were already checked", async () => {
  const createdTables: string[] = [];
  const authState = {
    mode: "sas-token" as const,
    sasToken: "sv=2025-01-05&sig=test",
    connection: {
      profile: "Dev" as const,
      storageAccountName: "satutslocalm",
      tableEndpoint: "https://satutslocalm.table.core.windows.net/",
      tableName: "BannersCacheTest",
      blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
      blobContainerName: "banner",
    },
  };

  const createClient = async () => ({
    createTable: async (tableName: string) => {
      createdTables.push(tableName);
      const error = Object.assign(new Error("exists"), {
        statusCode: 409,
      });
      throw error;
    },
  });

  await ensureTableExists(authState, createClient);
  await ensureTableExists(authState, createClient);

  assert.deepEqual(createdTables, ["BannersCacheTest"]);
});

test("ensureTableExists deduplicates concurrent table checks", async () => {
  const createdTables: string[] = [];
  let releaseCreateTable!: () => void;
  const createTableBarrier = new Promise<void>((resolve) => {
    releaseCreateTable = resolve;
  });
  const authState = {
    mode: "sas-token" as const,
    sasToken: "sv=2025-01-05&sig=test",
    connection: {
      profile: "Dev" as const,
      storageAccountName: "satutslocalm",
      tableEndpoint: "https://satutslocalm.table.core.windows.net/",
      tableName: "BannersConcurrentTest",
      blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
      blobContainerName: "banner",
    },
  };

  const createClient = async () => ({
    createTable: async (tableName: string) => {
      createdTables.push(tableName);
      await createTableBarrier;
      const error = Object.assign(new Error("exists"), {
        statusCode: 409,
      });
      throw error;
    },
  });

  const first = ensureTableExists(authState, createClient);
  const second = ensureTableExists(authState, createClient);
  releaseCreateTable();

  await Promise.all([first, second]);

  assert.deepEqual(createdTables, ["BannersConcurrentTest"]);
});

test("toRemoteEntity strips inline assets and stores blob paths", () => {
  const entity = toRemoteEntity(
    "banners",
    {
      id: "banner-1",
      updatedAt: 123,
      brandLogoUrl:
        "https://satutslocalm.blob.core.windows.net/banner/logos/brand.png",
      tutorialImageUrl: "data:image/png;base64,AAAA",
      currentDraft: {
        tutorialImageUrl: "blob:http://localhost:5173/demo",
      },
    },
    {
      mode: "sas-token",
      sasToken: "sv=2025-01-05&sig=test",
      connection: {
        profile: "Dev",
        storageAccountName: "satutslocalm",
        tableEndpoint: "https://satutslocalm.table.core.windows.net/",
        tableName: "BannersDev",
        blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
        blobContainerName: "banner",
      },
    },
  );

  assert.equal(entity.partitionKey, "banners");
  assert.equal(entity.rowKey, "banner-1");
  assert.equal(entity.updatedAt, 123);

  const data = JSON.parse(entity.data);
  assert.equal(data.brandLogoUrl, "logos/brand.png");
  assert.equal(data.tutorialImageUrl, null);
  assert.equal(data.currentDraft.tutorialImageUrl, null);
});

test("deleteRemoteDocumentsMissingLocally removes rows that no longer exist locally", async () => {
  const deletedRows: Array<{ partitionKey: string; rowKey: string }> = [];
  const localDocs = new Map<string, any>([["banner-2", { id: "banner-2" }]]);
  const remoteDocs = new Map<string, any>([
    ["banner-1", { id: "banner-1" }],
    ["banner-2", { id: "banner-2" }],
  ]);

  await deleteRemoteDocumentsMissingLocally(
    "banners",
    localDocs,
    remoteDocs,
    {
      mode: "sas-token",
      sasToken: "sv=2025-01-05&sig=test",
      connection: {
        profile: "Dev",
        storageAccountName: "satutslocalm",
        tableEndpoint: "https://satutslocalm.table.core.windows.net/",
        tableName: "BannersDev",
        blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
        blobContainerName: "banner",
      },
    },
    async () => ({
      deleteEntity: async (partitionKey: string, rowKey: string) => {
        deletedRows.push({ partitionKey, rowKey });
      },
    }),
  );

  assert.deepEqual(deletedRows, [
    { partitionKey: "banners", rowKey: "banner-1" },
  ]);
  assert.equal(remoteDocs.has("banner-1"), false);
});

test("upsertRemoteDocument writes a banner row immediately without waiting for full sync", async () => {
  const ensuredTables: string[] = [];
  const upsertedRows: Array<{ mode: string; entity: any }> = [];

  await upsertRemoteDocument(
    "banners",
    {
      id: "banner-1",
      updatedAt: 123,
      name: "Realtime Banner",
      brandLogoUrl:
        "https://satutslocalm.blob.core.windows.net/banner/logos/brand.png",
    },
    {
      mode: "sas-token",
      sasToken: "sv=2025-01-05&sig=test",
      connection: {
        profile: "Dev",
        storageAccountName: "satutslocalm",
        tableEndpoint: "https://satutslocalm.table.core.windows.net/",
        tableName: "BannersDev",
        blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
        blobContainerName: "banner",
      },
    },
    {
      ensureTable: async () => {
        ensuredTables.push("BannersDev");
      },
      createClient: async () => ({
        upsertEntity: async (entity: any, mode?: string) => {
          upsertedRows.push({ entity, mode: mode ?? "Replace" });
          return {} as any;
        },
      }),
    },
  );

  assert.deepEqual(ensuredTables, ["BannersDev"]);
  assert.equal(upsertedRows.length, 1);
  assert.equal(upsertedRows[0]?.mode, "Replace");
  assert.equal(upsertedRows[0]?.entity.partitionKey, "banners");
  assert.equal(upsertedRows[0]?.entity.rowKey, "banner-1");

  const data = JSON.parse(String(upsertedRows[0]?.entity.data));
  assert.equal(data.brandLogoUrl, "logos/brand.png");
  assert.equal(data.name, "Realtime Banner");
});

test("deleteRemoteDocument removes a banner row immediately without waiting for full sync", async () => {
  const ensuredTables: string[] = [];
  const deletedRows: Array<{ partitionKey: string; rowKey: string }> = [];

  await deleteRemoteDocument(
    "banners",
    "banner-1",
    {
      mode: "sas-token",
      sasToken: "sv=2025-01-05&sig=test",
      connection: {
        profile: "Dev",
        storageAccountName: "satutslocalm",
        tableEndpoint: "https://satutslocalm.table.core.windows.net/",
        tableName: "BannersDev",
        blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
        blobContainerName: "banner",
      },
    },
    {
      ensureTable: async () => {
        ensuredTables.push("BannersDev");
      },
      createClient: async () => ({
        deleteEntity: async (partitionKey: string, rowKey: string) => {
          deletedRows.push({ partitionKey, rowKey });
          return {} as any;
        },
      }),
    },
  );

  assert.deepEqual(ensuredTables, ["BannersDev"]);
  assert.deepEqual(deletedRows, [
    { partitionKey: "banners", rowKey: "banner-1" },
  ]);
});

test("createAzureTableCrudAdapter lists records for a partition without mutating local state", async () => {
  const adapter = createAzureTableCrudAdapter<{
    id: string;
    updatedAt: number;
    name: string;
  }>(
    "themes",
    {
      mode: "sas-token",
      sasToken: "sv=2025-01-05&sig=test",
      connection: {
        profile: "Dev",
        storageAccountName: "satutslocalm",
        tableEndpoint: "https://satutslocalm.table.core.windows.net/",
        tableName: "BannersDev",
        blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
        blobContainerName: "banner",
      },
    },
    {
      ensureTable: async () => {},
      createClient: async () =>
        ({
          listEntities: async function* () {
            yield {
              rowKey: "theme-1",
              data: JSON.stringify({ id: "theme-1", name: "Dark Duplicate" }),
              updatedAt: 456,
            };
          },
          upsertEntity: async () => ({}) as any,
          deleteEntity: async () => ({}) as any,
        }) as any,
    },
  );

  const records = await adapter.list();

  assert.equal(records[0]?.id, "theme-1");
  assert.equal(records[0]?.updatedAt, 456);
  assert.equal(records[0]?.name, "Dark Duplicate");
});

test("refreshCollectionsFromAzure pulls remote data into the cache without pushing local-only rows", async () => {
  const removedIds: string[] = [];
  const upsertedDocs: any[] = [];
  const localOnlyDoc = {
    toJSON: () => ({ id: "local-only", updatedAt: 1, name: "Local Only" }),
    remove: async () => {
      removedIds.push("local-only");
    },
  };
  const collection = {
    find: () => ({ exec: async () => [localOnlyDoc] }),
    upsert: async (doc: any) => {
      upsertedDocs.push(doc);
      return doc;
    },
  };

  await refreshCollectionsFromAzure(
    {
      settings: collection,
      presets: collection,
      banners: collection,
      themes: collection,
      app_state: collection,
    } as any,
    {
      mode: "sas-token",
      sasToken: "sv=2025-01-05&sig=test",
      connection: {
        profile: "Dev",
        storageAccountName: "satutslocalm",
        tableEndpoint: "https://satutslocalm.table.core.windows.net/",
        tableName: "BannersDev",
        blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
        blobContainerName: "banner",
      },
    },
    {
      collectionNames: ["themes"],
      ensureTableExistsFn: async () => {},
      getRemoteDocumentsFn: async () =>
        new Map([
          [
            "theme-1",
            {
              id: "theme-1",
              updatedAt: 456,
              name: "Dark Duplicate",
            },
          ],
        ]),
    },
  );

  assert.deepEqual(upsertedDocs, [
    {
      id: "theme-1",
      updatedAt: 456,
      name: "Dark Duplicate",
    },
  ]);
  assert.deepEqual(removedIds, ["local-only"]);
});

test("syncDatabaseOnce pulls remote-only banners instead of deleting them on another machine", async () => {
  const deleteCalls: string[] = [];
  const pulledDocs: any[] = [];
  const emptyCollection = {
    find: () => ({ exec: async () => [] }),
    upsert: async (doc: any) => {
      pulledDocs.push(doc);
    },
  };

  await syncDatabaseOnce(
    {
      settings: emptyCollection,
      presets: emptyCollection,
      banners: emptyCollection,
      themes: emptyCollection,
      app_state: emptyCollection,
    } as any,
    {
      mode: "sas-token",
      sasToken: "sv=2025-01-05&sig=test",
      connection: {
        profile: "Dev",
        storageAccountName: "satutslocalm",
        tableEndpoint: "https://satutslocalm.table.core.windows.net/",
        tableName: "BannersDev",
        blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
        blobContainerName: "banner",
      },
    },
    {
      ensureTableExistsFn: async () => {},
      getRemoteDocumentsFn: async (partitionKey: string) =>
        partitionKey === "banners"
          ? new Map([
              [
                "banner-1",
                {
                  id: "banner-1",
                  updatedAt: 123,
                  name: "Remote Banner",
                },
              ],
            ])
          : new Map(),
      deleteRemoteDocumentsMissingLocallyFn: async (partitionKey: string) => {
        deleteCalls.push(partitionKey);
      },
    },
  );

  assert.deepEqual(deleteCalls, []);
  assert.deepEqual(pulledDocs, [
    {
      id: "banner-1",
      updatedAt: 123,
      name: "Remote Banner",
    },
  ]);
});

test("syncDatabaseOnce can limit work to selected collections", async () => {
  const processedPartitions: string[] = [];
  const collection = {
    find: () => ({ exec: async () => [] }),
    upsert: async () => {},
  };

  await syncDatabaseOnce(
    {
      settings: collection,
      presets: collection,
      banners: collection,
      themes: collection,
      app_state: collection,
    } as any,
    {
      mode: "sas-token",
      sasToken: "sv=2025-01-05&sig=test",
      connection: {
        profile: "Dev",
        storageAccountName: "satutslocalm",
        tableEndpoint: "https://satutslocalm.table.core.windows.net/",
        tableName: "BannersDev",
        blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
        blobContainerName: "banner",
      },
    },
    {
      collectionNames: ["themes"],
      ensureTableExistsFn: async () => {},
      getRemoteDocumentsFn: async (partitionKey: string) => {
        processedPartitions.push(partitionKey);
        return new Map();
      },
    },
  );

  assert.deepEqual(processedPartitions, ["themes"]);
});
