import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_APP_STATE,
  normalizeDraftBannerState,
} from "../../src/hooks/useAppState";
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

test("normalizeDraftBannerState lifts a legacy draft into templateEntries", () => {
  const normalized = normalizeDraftBannerState({
    bannerId: "draft-1",
    name: "Legacy Draft",
    templateId: "intro_bite_thumbnail",
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: { title: "Legacy Bite" },
    borderWidth: 18,
    borderColor: "#22d3ee",
    fontPairId: "share-tech-outfit",
    primaryFontFamily: "'Outfit', sans-serif",
    secondaryFontFamily: "'Share Tech Mono', monospace",
    fontSize: 96,
    brandLogoUrl: null,
    brandLogoSize: 90,
    showCopyrightMessage: true,
    copyrightText: "© LocalM™",
    tutorialImageUrl: null,
    tutorialImageSize: 100,
    tutorialImageBottomPadding: 24,
    tutorialImageOpacity: 100,
  } as any);

  assert.ok(normalized);
  assert.ok(normalized.templateEntries);

  assert.equal(normalized.templateId, "intro_bite_thumbnail");
  assert.equal(normalized.templateEntries.length, 1);
  assert.equal(normalized.templateEntries[0]?.templateId, "intro_bite_thumbnail");
  assert.equal(normalized.templateEntries[0]?.fieldValues.title, "Legacy Bite");
});
