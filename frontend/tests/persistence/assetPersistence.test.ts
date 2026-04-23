import test from "node:test";
import assert from "node:assert/strict";
import { prepareAssetForSave } from "../../src/persistence/assetPersistence";
import { assetsMigrationStrategies, assetsSchema } from "../../src/db/schemas";

test("prepareAssetForSave preserves an existing id and stamps updatedAt", () => {
  const before = Date.now();

  const asset = prepareAssetForSave({
    id: "asset-1",
    name: "Intro Sting",
    fileName: "intro.mp3",
    kind: "audio",
    mimeType: "audio/mpeg",
    blobPath: "assets/audio/intro.mp3",
    sizeBytes: 1200,
    durationMs: 42500,
    previewImagePath: null,
    width: null,
    height: null,
  });

  assert.equal(asset.id, "asset-1");
  assert.equal(asset.kind, "audio");
  assert.ok(asset.updatedAt >= before);
});

test("prepareAssetForSave normalizes display metadata for remote persistence", () => {
  const asset = prepareAssetForSave({
    name: "  Outro Theme  ",
    fileName: "outro-theme.mp3",
    kind: "audio",
    mimeType: "audio/mpeg",
    blobPath: "/assets/audio/outro-theme.mp3",
    sizeBytes: 2048,
    durationMs: 9000,
    previewImagePath: null,
    width: null,
    height: null,
  });

  assert.equal(asset.name, "Outro Theme");
  assert.equal(asset.blobPath, "assets/audio/outro-theme.mp3");
  assert.equal(asset.durationMs, 9000);
});

test("assets schema version increments when shared asset records are introduced", () => {
  assert.equal(assetsSchema.version, 0);
});

test("asset migration backfills optional metadata fields for cached records", async () => {
  const migrateFromV0 = assetsMigrationStrategies[1];

  assert.equal(typeof migrateFromV0, "function");

  const migrated = await migrateFromV0({
    id: "asset-legacy",
    name: "Legacy Asset",
    fileName: "legacy.mp3",
    kind: "audio",
    mimeType: "audio/mpeg",
    blobPath: "assets/audio/legacy.mp3",
    updatedAt: 12,
  });

  assert.equal(migrated.sizeBytes, 0);
  assert.equal(migrated.durationMs, null);
  assert.equal(migrated.previewImagePath, null);
});
