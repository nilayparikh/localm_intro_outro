import test from "node:test";
import assert from "node:assert/strict";
import {
  getGridPatternMetrics,
  getScaledBorderWidth,
  REFERENCE_CANVAS,
} from "../../src/templates/rendering";

test("grid metrics preserve density across resolutions", () => {
  const dot1k = getGridPatternMetrics("dots", 1024);
  const dot4k = getGridPatternMetrics("dots", 3840);
  const hex1k = getGridPatternMetrics("hexagon", 1024);
  const hex4k = getGridPatternMetrics("hexagon", 3840);

  assert.equal(dot1k.tileWidth, 30);
  assert.equal(dot4k.tileWidth, 113);
  assert.equal(dot1k.dotRadius, 2);
  assert.equal(dot4k.dotRadius, 8);

  assert.equal(hex1k.tileWidth, 56);
  assert.equal(hex1k.tileHeight, 100);
  assert.equal(hex4k.tileWidth, 210);
  assert.equal(hex4k.tileHeight, 375);
});

test("scaled border width uses a 4k reference and preserves non-zero borders", () => {
  assert.equal(getScaledBorderWidth(REFERENCE_CANVAS.width, 120), 120);
  assert.equal(getScaledBorderWidth(1024, 120), 32);
  assert.equal(getScaledBorderWidth(2048, 120), 64);
  assert.equal(getScaledBorderWidth(1024, 1), 1);
  assert.equal(getScaledBorderWidth(1024, 0), 0);
});
