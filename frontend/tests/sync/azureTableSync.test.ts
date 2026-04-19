import test from "node:test";
import assert from "node:assert/strict";
import { Subject } from "rxjs";
import {
  buildTableClientConfig,
  ensureTableExists,
  awaitReplicationsInSync,
  SYNCABLE_COLLECTIONS,
  toRemoteEntity,
} from "../../src/sync/azureTableSync";

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
