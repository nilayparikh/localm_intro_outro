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
    category: "marketing",
    tags: ["music"],
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
    category: "  Social Clips  ",
    tags: ["  Outro  ", "music", "outro", "MUSIC"],
  });

  assert.equal(asset.name, "Outro Theme");
  assert.equal(asset.blobPath, "assets/audio/outro-theme.mp3");
  assert.equal(asset.durationMs, 9000);
  assert.equal(asset.category, "social clips");
  assert.deepEqual(asset.tags, ["outro", "music"]);
});

test("assets schema version increments when category metadata is introduced", () => {
  assert.equal(assetsSchema.version, 2);
});

test("asset migration backfills optional metadata fields, category, and tags for cached records", async () => {
  const migrateFromV1 = assetsMigrationStrategies[2];

  assert.equal(typeof migrateFromV1, "function");

  const migrated = await migrateFromV1({
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
  assert.equal(migrated.category, "");
  assert.deepEqual(migrated.tags, []);
});
