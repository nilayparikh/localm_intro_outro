import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_APP_STATE } from "../../src/hooks/useAppState";

test("default app state uses manual sync mode", () => {
  assert.equal(DEFAULT_APP_STATE.autoStartSync, false);
});
