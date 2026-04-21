import test from "node:test";
import assert from "node:assert/strict";
import { createAzureCachedCollectionApi } from "@common";

type FakeRecord = {
  id: string;
  updatedAt: number;
  name: string;
};

function createFakeRxCollection(initialRecords: FakeRecord[] = []) {
  const records = new Map(initialRecords.map((record) => [record.id, record]));
  const fakeCollection = {
    lastUpsert: null as FakeRecord | null,
    lastRemovedId: null as string | null,
    find: () => ({
      exec: async () =>
        [...records.values()].map((record) => ({
          toJSON: () => record,
          remove: async () => {
            records.delete(record.id);
          },
        })),
    }),
    findOne: (id: string) => ({
      exec: async () => {
        const record = records.get(id);
        if (!record) {
          return null;
        }

        return {
          toJSON: () => record,
          remove: async () => {
            records.delete(id);
          },
        };
      },
    }),
    upsert: async (record: FakeRecord) => {
      records.set(record.id, record);
      fakeCollection.lastUpsert = record;
      return record;
    },
    snapshot: () => [...records.values()],
  };

  return fakeCollection;
}

test("save writes remote first and mirrors the remote response into the cache", async () => {
  const calls: string[] = [];
  const remote = {
    list: async () => [] as FakeRecord[],
    upsert: async (record: FakeRecord) => {
      calls.push("remote-upsert");
      return { ...record, updatedAt: 200 };
    },
    delete: async () => {
      calls.push("remote-delete");
    },
  };

  const cache = createFakeRxCollection();
  const api = createAzureCachedCollectionApi<FakeRecord, FakeRecord>({
    collection: cache,
    remote,
    prepareForSave: (record) => record,
  });

  await api.save({ id: "theme-1", updatedAt: 100, name: "Dark Duplicate" });

  assert.deepEqual(calls, ["remote-upsert"]);
  assert.equal(cache.lastUpsert?.updatedAt, 200);
});

test("load in remote-first mode ignores cached records and refreshes server data", async () => {
  const remoteRecords: FakeRecord[] = [
    { id: "theme-2", updatedAt: 300, name: "Server Theme" },
  ];
  const remote = {
    list: async () => remoteRecords,
    upsert: async (record: FakeRecord) => record,
    delete: async () => {},
  };

  const cache = createFakeRxCollection([
    { id: "theme-1", updatedAt: 100, name: "Stale Local Theme" },
  ]);
  const api = createAzureCachedCollectionApi<FakeRecord, FakeRecord>({
    collection: cache,
    remote,
    prepareForSave: (record) => record,
    loadStrategy: "remote-first",
  });

  const loadedRecords = await api.load();

  assert.deepEqual(loadedRecords, remoteRecords);
  assert.deepEqual(cache.snapshot(), remoteRecords);
});
