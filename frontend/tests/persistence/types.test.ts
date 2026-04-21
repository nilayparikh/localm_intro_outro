import test from "node:test";
import assert from "node:assert/strict";
import type { CachedCrudRecord } from "@common";

test("cached CRUD records require id and updatedAt for cache reconciliation", () => {
  const record: CachedCrudRecord = {
    id: "banner-1",
    updatedAt: 1713744000000,
  };

  assert.equal(record.id, "banner-1");
  assert.equal(record.updatedAt, 1713744000000);
});
