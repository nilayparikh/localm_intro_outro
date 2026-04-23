import test from "node:test";
import assert from "node:assert/strict";
import { buildAssetOptions, sortAssets } from "../../src/hooks/useAssets";
import type { AssetDoc } from "../../src/persistence/assetPersistence";

function createAsset(id: string, overrides: Partial<AssetDoc> = {}): AssetDoc {
  return {
    id,
    name: `Asset ${id}`,
    fileName: `${id}.mp3`,
    kind: "audio",
    mimeType: "audio/mpeg",
    blobPath: `assets/audio/${id}.mp3`,
    sizeBytes: 1024,
    durationMs: 15000,
    previewImagePath: null,
    width: null,
    height: null,
    updatedAt: 1,
    ...overrides,
  };
}

test("sortAssets orders by most recently updated asset first", () => {
  const sorted = sortAssets([
    createAsset("old", { updatedAt: 10 }),
    createAsset("new", { updatedAt: 20 }),
  ]);

  assert.deepEqual(
    sorted.map((asset) => asset.id),
    ["new", "old"],
  );
});

test("buildAssetOptions filters by kind and formats labels", () => {
  const options = buildAssetOptions(
    [
      createAsset("intro", {
        name: "Intro Sting",
        fileName: "intro.mp3",
        durationMs: 42500,
      }),
      createAsset("poster", {
        kind: "image",
        fileName: "poster.png",
        mimeType: "image/png",
        durationMs: null,
      }),
    ],
    "audio",
  );

  assert.deepEqual(options, [
    { value: "intro", label: "Intro Sting [intro.mp3] | 00:42.5" },
  ]);
});
