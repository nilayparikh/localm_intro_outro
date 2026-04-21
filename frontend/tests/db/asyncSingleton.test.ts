import test from "node:test";
import assert from "node:assert/strict";
import { createAsyncSingleton } from "../../src/db/asyncSingleton";
import { getDatabaseOptions } from "../../src/db/databaseOptions";

test("createAsyncSingleton only runs the factory once for concurrent callers", async () => {
  let calls = 0;
  const getValue = createAsyncSingleton(async () => {
    calls += 1;
    await Promise.resolve();
    return { value: "ok" };
  });

  const [first, second] = await Promise.all([getValue(), getValue()]);

  assert.equal(calls, 1);
  assert.equal(first, second);
});

test("createAsyncSingleton retries after a failed attempt", async () => {
  let calls = 0;
  const getValue = createAsyncSingleton(async () => {
    calls += 1;
    if (calls === 1) {
      throw new Error("boom");
    }
    return 42;
  });

  await assert.rejects(() => getValue(), /boom/);
  const result = await getValue();

  assert.equal(calls, 2);
  assert.equal(result, 42);
});

test("getDatabaseOptions uses closeDuplicates in dev instead of ignoreDuplicate", () => {
  const options = getDatabaseOptions(true);

  assert.equal(options.name, "localm_intro_outro");
  assert.equal(options.closeDuplicates, true);
  assert.equal(options.multiInstance, false);
  assert.equal("ignoreDuplicate" in options, false);
});
