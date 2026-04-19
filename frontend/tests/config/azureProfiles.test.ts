import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAzureTableName,
  detectAzureProfileFromTableName,
} from "../../src/azureProfiles";

test("buildAzureTableName uses the Banners prefix with Dev and Prod suffixes", () => {
  assert.equal(buildAzureTableName("Dev"), "BannersDev");
  assert.equal(buildAzureTableName("Prod"), "BannersProd");
});

test("detectAzureProfileFromTableName recognizes camel-cased profile tables", () => {
  assert.equal(detectAzureProfileFromTableName("BannersDev"), "Dev");
  assert.equal(detectAzureProfileFromTableName("BannersProd"), "Prod");
  assert.equal(detectAzureProfileFromTableName("banners"), null);
});
