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

test("template frames isolate backdrop-filter layers for glass surfaces", async () => {
  const { buildTemplateFrameStyle } =
    await import("../../src/templates/rendering");

  const style = buildTemplateFrameStyle({
    width: REFERENCE_CANVAS.width,
    height: REFERENCE_CANVAS.height,
    fontFamily: "'Outfit', sans-serif",
    theme: {
      background: "#0b1120",
      surface: "#111827",
      textPrimary: "#f8fafc",
      textSecondary: "#94a3b8",
      accent: "#22d3ee",
      borderColor: "#22d3ee",
      gradientStart: "#0b1120",
      gradientMid: "#111827",
      gradientEnd: "#1e293b",
      backgroundImage: "linear-gradient(135deg, #0b1120, #111827, #1e293b)",
    },
    borderWidth: 0,
    borderColor: "#22d3ee",
  });

  assert.equal(style.isolation, "isolate");
});
