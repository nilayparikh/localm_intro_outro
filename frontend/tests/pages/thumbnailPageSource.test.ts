import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const thumbnailPageSource = readFileSync(
  path.resolve(currentDir, "../../src/pages/ThumbnailPage.tsx"),
  "utf8",
);

test("thumbnail page no longer renders the removed outro arrows settings panel", () => {
  assert.equal(thumbnailPageSource.includes('title="Outro Arrows"'), false);
  assert.equal(
    thumbnailPageSource.includes("handleAddOutroArrowOverlay"),
    false,
  );
  assert.equal(
    thumbnailPageSource.includes("handleRemoveOutroArrowOverlay"),
    false,
  );
  assert.equal(
    thumbnailPageSource.includes("handleOutroArrowOverlayChange"),
    false,
  );
});

test("thumbnail page uses a dynamic app/module/template title and exposes an outro support-line action", () => {
  assert.equal(
    thumbnailPageSource.includes('title="Thumbnail Generator"'),
    false,
  );
  assert.equal(thumbnailPageSource.includes('label="Add Support Line"'), true);
});
