import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_APP_STATE } from "../../src/hooks/useAppState";
import { appStateMigrationStrategies, appStateSchema } from "../../src/db/schemas";

test("default app state uses manual sync mode", () => {
  assert.equal(DEFAULT_APP_STATE.autoStartSync, false);
});

test("default app state no longer persists animation-specific draft data", () => {
  assert.equal("currentAnimationDraft" in DEFAULT_APP_STATE, false);
});

test("app state schema no longer exposes animation-specific properties", () => {
  assert.equal(
    Object.hasOwn(appStateSchema.properties ?? {}, "currentAnimationDraft"),
    false,
  );
});

test("app state schema version increments when animation draft persistence is removed", () => {
  assert.equal(appStateSchema.version, 1);
});

test("app state migration removes legacy animation draft state", async () => {
  const migrateFromV0 = appStateMigrationStrategies[1];

  assert.equal(typeof migrateFromV0, "function");

  const migrated = await migrateFromV0({
    id: "ui_state",
    autoSaveOnLogout: true,
    autoStartSync: false,
    currentDraft: { name: "Draft" },
    currentAnimationDraft: { mode: "intro" },
    draftDirty: false,
    lastSyncAt: null,
    lastSyncStatus: "idle",
    lastSyncMessage: "Sync has not run yet.",
    updatedAt: 123,
  });

  assert.equal("currentAnimationDraft" in migrated, false);
  assert.deepEqual(migrated.currentDraft, { name: "Draft" });
});
