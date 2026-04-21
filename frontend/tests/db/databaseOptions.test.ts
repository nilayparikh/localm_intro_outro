import test from "node:test";
import assert from "node:assert/strict";
import {
  createDatabaseHashFunction,
  getDatabaseOptions,
} from "../../src/db/databaseOptions";

test("localm intro outro uses its own browser database namespace", () => {
  assert.equal(getDatabaseOptions(false).name, "localm_intro_outro");
});

test("database options provide a custom hash function", () => {
  assert.equal(typeof getDatabaseOptions(false).hashFunction, "function");
});

test("custom database hash function returns stable sha256 hashes", async () => {
  const hash = createDatabaseHashFunction();

  assert.equal(
    await hash("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(await hash("abc"), await hash("abc"));
  assert.notEqual(await hash("abc"), await hash("abcd"));
});