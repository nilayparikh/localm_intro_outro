import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssetBlobPath,
  classifyAssetKind,
  formatAssetOptionLabel,
} from "../../src/persistence/assetPersistence";

test("classifyAssetKind maps mime types to the shared asset categories", () => {
  assert.equal(classifyAssetKind("audio/mpeg"), "audio");
  assert.equal(classifyAssetKind("video/mp4"), "video");
  assert.equal(classifyAssetKind("image/webp"), "image");
  assert.equal(classifyAssetKind("application/pdf"), "file");
});

test("buildAssetBlobPath stores uploaded files under typed asset folders", () => {
  const path = buildAssetBlobPath({
    fileName: "intro sting.mp3",
    kind: "audio",
    timestamp: 1710000000000,
  });

  assert.match(path, /^assets\/audio\/1710000000000-intro-sting\.mp3$/);
});

test("formatAssetOptionLabel uses Name [filename] | duration format when duration exists", () => {
  assert.equal(
    formatAssetOptionLabel({
      name: "Intro Sting",
      fileName: "intro.mp3",
      durationMs: 42500,
    }),
    "Intro Sting [intro.mp3] | 00:42.5",
  );
});

test("formatAssetOptionLabel omits duration for non-timed assets", () => {
  assert.equal(
    formatAssetOptionLabel({
      name: "Backdrop",
      fileName: "backdrop.png",
      durationMs: null,
    }),
    "Backdrop [backdrop.png]",
  );
});
