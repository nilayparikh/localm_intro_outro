import test from "node:test";
import assert from "node:assert/strict";
import {
  createDefaultOutroArrowOverlay,
  normalizeOutroArrowOverlays,
} from "../../src/templates/outroArrowAssets";

test("default outro arrows use separate width and height controls", () => {
  const overlay = createDefaultOutroArrowOverlay();

  assert.equal(overlay.arrowWidth, 100);
  assert.equal(overlay.arrowHeight, 100);
  assert.equal(overlay.textSize, 100);
  assert.ok(!("arrowSize" in overlay));
  assert.ok(!("isBold" in overlay));
  assert.ok(!("isItalic" in overlay));
  assert.ok(!("thickness" in overlay));
});

test("normalizeOutroArrowOverlays migrates legacy size and style fields to width and height", () => {
  const overlays = normalizeOutroArrowOverlays([
    {
      id: "legacy-arrow",
      type: "course",
      text: "COURSE",
      x: 84,
      y: 76,
      degree: 318,
      isInverse: true,
      textSize: 188,
      arrowSize: 136,
      isBold: true,
      isItalic: true,
      thickness: "thick",
    },
  ]);

  assert.deepEqual(overlays, [
    {
      id: "legacy-arrow",
      type: "course",
      text: "COURSE",
      x: 84,
      y: 76,
      degree: 318,
      isInverse: true,
      textSize: 188,
      arrowWidth: 136,
      arrowHeight: 136,
    },
  ]);
});
