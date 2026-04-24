import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssetSearchToken,
  parseAssetTagInput,
} from "../../src/pages/assetsMetadata";

test("asset tag helpers normalize comma-separated tags and build #tag tokens", () => {
  assert.deepEqual(parseAssetTagInput(" Foreground, icon ,foreground "), [
    "foreground",
    "icon",
  ]);
  assert.equal(buildAssetSearchToken("#", "Foreground"), "#foreground");
});
