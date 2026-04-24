import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssetOptions,
  collectAssetTags,
  filterAssets,
  parseAssetSearchQuery,
  sortAssets,
} from "../../src/hooks/useAssets";
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
    category: "",
    tags: [],
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

test("parseAssetSearchQuery separates free text and #tags while ignoring removed category tokens", () => {
  const parsed = parseAssetSearchQuery(
    "intro teaser #music #launch @marketing @social",
  );

  assert.deepEqual(parsed, {
    text: "intro teaser",
    tags: ["music", "launch"],
  });
});

test("filterAssets combines free text, kind, and tags without using categories", () => {
  const filtered = filterAssets(
    [
      createAsset("intro", {
        name: "Intro Sting",
        kind: "audio",
        category: "marketing",
        tags: ["music", "intro"],
        updatedAt: 20,
      }),
      createAsset("outro", {
        name: "Outro Theme",
        kind: "audio",
        category: "social",
        tags: ["music", "outro"],
        updatedAt: 10,
      }),
      createAsset("poster", {
        name: "Launch Poster",
        kind: "image",
        category: "marketing",
        fileName: "poster.png",
        mimeType: "image/png",
        durationMs: null,
        tags: ["branding"],
        updatedAt: 30,
      }),
    ],
    {
      searchText: "intro #music @marketing",
      kind: "audio",
    },
  );

  assert.deepEqual(
    filtered.map((asset) => asset.id),
    ["intro"],
  );
});

test("collectAssetTags returns unique sorted tags from the library", () => {
  const tags = collectAssetTags([
    createAsset("intro", { tags: ["music", "intro"] }),
    createAsset("poster", {
      kind: "image",
      tags: ["branding", "music"],
    }),
  ]);

  assert.deepEqual(tags, ["branding", "intro", "music"]);
});
