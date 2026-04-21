import test from "node:test";
import assert from "node:assert/strict";
import { prepareBannerForSave } from "../../src/persistence/bannerPersistence";

test("prepareBannerForSave preserves an existing id and stamps updatedAt", () => {
  const before = Date.now();
  const banner = prepareBannerForSave({
    id: "banner-1",
    name: "New Banner",
    templateId: "tutorial_thumbnail",
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: { title: "Azure Cache" },
    borderWidth: 0,
    borderColor: "#ffffff",
    fontPairId: "pair-1",
    primaryFontFamily: "Inter",
    secondaryFontFamily: "Roboto",
    fontSize: 48,
    brandLogoUrl: null,
    brandLogoSize: 80,
    showCopyrightMessage: true,
    copyrightText: "Copyright",
    tutorialImageUrl: null,
    tutorialImageSize: 100,
    tutorialImageBottomPadding: 0,
    tutorialImageOpacity: 100,
  });

  assert.equal(banner.id, "banner-1");
  assert.equal(banner.name, "New Banner");
  assert.ok(banner.updatedAt >= before);
});
