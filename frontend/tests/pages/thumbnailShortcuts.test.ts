import test from "node:test";
import assert from "node:assert/strict";
import { resolveThumbnailShortcutAction } from "../../src/pages/thumbnailShortcuts";

test("thumbnail shortcuts map ctrl and meta save, undo, and redo commands", () => {
  assert.equal(
    resolveThumbnailShortcutAction({ key: "s", ctrlKey: true }),
    "save",
  );
  assert.equal(
    resolveThumbnailShortcutAction({ key: "z", ctrlKey: true }),
    "undo",
  );
  assert.equal(
    resolveThumbnailShortcutAction({ key: "y", ctrlKey: true }),
    "redo",
  );
  assert.equal(
    resolveThumbnailShortcutAction({ key: "z", metaKey: true, shiftKey: true }),
    "redo",
  );
});

test("thumbnail shortcuts ignore unrelated key chords", () => {
  assert.equal(
    resolveThumbnailShortcutAction({ key: "s", ctrlKey: false }),
    null,
  );
  assert.equal(
    resolveThumbnailShortcutAction({ key: "z", ctrlKey: true, altKey: true }),
    null,
  );
  assert.equal(
    resolveThumbnailShortcutAction({ key: "p", metaKey: true }),
    null,
  );
});
