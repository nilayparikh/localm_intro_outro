import test from "node:test";
import assert from "node:assert/strict";
import { prepareBannerForSave } from "../../src/persistence/bannerPersistence";
import {
  bannersMigrationStrategies,
  bannersSchema,
} from "../../src/db/schemas";

function createTemplateEntry(
  templateId: string,
  title: string,
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    templateId,
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: { title },
    borderWidth: 12,
    borderColor: "#22d3ee",
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
    ...overrides,
  };
}

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

test("prepareBannerForSave keeps one full entry per template type", () => {
  const banner = prepareBannerForSave({
    id: "banner-bundle",
    name: "Bundle Banner",
    templateId: "outro_thumbnail",
    templateEntries: [
      createTemplateEntry("intro_bite_thumbnail", "Intro Bite Title"),
      createTemplateEntry("outro_thumbnail", "First Outro Title"),
      createTemplateEntry("outro_thumbnail", "Final Outro Title"),
    ],
  } as any);

  assert.ok(banner.templateEntries);

  assert.deepEqual(
    banner.templateEntries.map((entry) => entry.templateId),
    ["intro_bite_thumbnail", "outro_thumbnail"],
  );
  assert.equal(
    banner.templateEntries.find(
      (entry) => entry.templateId === "outro_thumbnail",
    )?.fieldValues.title,
    "Final Outro Title",
  );
});

test("prepareBannerForSave lifts a legacy single-template payload into templateEntries", () => {
  const banner = prepareBannerForSave({
    id: "legacy-banner",
    name: "Legacy Banner",
    templateId: "tutorial_thumbnail",
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: { title: "Legacy Title", badge: "Tutorial" },
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
  } as any);

  assert.equal(banner.templateEntries?.length, 1);
  assert.equal(banner.templateEntries?.[0]?.templateId, "tutorial_thumbnail");
  assert.equal(banner.templateEntries?.[0]?.themeId, "dark");
  assert.equal(banner.templateEntries?.[0]?.fieldValues.title, "Legacy Title");
});

test("prepareBannerForSave preserves outro arrow overlays in the saved template entry", () => {
  const banner = prepareBannerForSave({
    id: "outro-arrow-banner",
    name: "Outro Arrow Banner",
    templateId: "outro_thumbnail",
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: {
      title: "Thank You for Watching",
      subtitle: "Want more? Subscribe and press the bell",
    },
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
    ...({
      outroArrowOverlays: [
        {
          id: "saved-arrow",
          type: "full_video",
          text: "FULL VIDEO",
          x: 18,
          y: 32,
          degree: 0,
          isInverse: false,
          textSize: 126,
          arrowSize: 144,
          isBold: true,
          isItalic: true,
          thickness: "thick",
        },
      ],
    } as any),
  } as any);

  assert.deepEqual((banner.templateEntries?.[0] as any)?.outroArrowOverlays, [
    {
      id: "saved-arrow",
      type: "full_video",
      text: "FULL VIDEO",
      x: 18,
      y: 32,
      degree: 0,
      isInverse: false,
      textSize: 126,
      arrowSize: 144,
      isBold: true,
      isItalic: true,
      thickness: "thick",
    },
  ]);
});

test("banner schema version increments when outro arrow typography settings are added", () => {
  assert.equal(bannersSchema.version, 3);
});

test("banner migration lifts legacy cached banners into templateEntries", async () => {
  const migrateFromV0 = bannersMigrationStrategies[1];

  assert.equal(typeof migrateFromV0, "function");

  const migrated = await migrateFromV0({
    id: "legacy-banner",
    name: "Legacy Banner",
    templateId: "tutorial_thumbnail",
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: { title: "Legacy Title" },
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
    updatedAt: 123,
  });

  assert.equal(migrated.templateEntries.length, 1);
  assert.equal(migrated.templateEntries[0]?.templateId, "tutorial_thumbnail");
  assert.equal(migrated.templateEntries[0]?.fieldValues.title, "Legacy Title");
});
