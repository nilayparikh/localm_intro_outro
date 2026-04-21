import test from "node:test";
import assert from "node:assert/strict";
import { buildUploadedLogoPath } from "../../src/hooks/useLogoUpload";

test("buildUploadedLogoPath versions shared logos so replacements do not reuse a cached blob URL", () => {
  const path = buildUploadedLogoPath("company-mark.png", 1713571200000);

  assert.equal(path, "logos/logo-1713571200000.png");
  assert.notEqual(path, "logos/logo.png");
});

test("buildUploadedLogoPath falls back to png when the file name has no extension", () => {
  assert.equal(
    buildUploadedLogoPath("brandmark", 1713571200000),
    "logos/logo-1713571200000.png",
  );
});