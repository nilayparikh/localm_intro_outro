import test from "node:test";
import assert from "node:assert/strict";
import { buildCaptureOptions } from "../../src/hooks/useExport";

test("buildCaptureOptions keeps fonts enabled so export text matches preview wrapping", () => {
  assert.deepEqual(buildCaptureOptions(), {
    quality: 1,
    pixelRatio: 1,
    skipAutoScale: true,
    skipFonts: false,
  });
});

test("buildCaptureOptions keeps explicit quality overrides", () => {
  assert.deepEqual(buildCaptureOptions({ quality: 0.75 }), {
    quality: 0.75,
    pixelRatio: 1,
    skipAutoScale: true,
    skipFonts: false,
  });
});