import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTemplateEntries,
  resolveTemplateSelection,
  type BannerTemplateEntry,
} from "../../src/persistence/bannerTemplateEntries";

function createTemplateEntry(
  templateId: string,
  title: string,
  overrides: Partial<BannerTemplateEntry> = {},
): BannerTemplateEntry {
  return {
    templateId,
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: { title },
    borderWidth: 24,
    borderColor: "#22d3ee",
    fontPairId: "share-tech-outfit",
    primaryFontFamily: "'Outfit', sans-serif",
    secondaryFontFamily: "'Share Tech Mono', monospace",
    fontSize: 96,
    brandLogoUrl: null,
    brandLogoSize: 90,
    showCopyrightMessage: true,
    copyrightText: "© LocalM™",
    tutorialImageUrl: null,
    tutorialImageSize: 100,
    tutorialImageBottomPadding: 24,
    tutorialImageOpacity: 100,
    ...overrides,
  };
}

test("resolveTemplateSelection restores an existing template entry without duplicating it", () => {
  const tutorialEntry = createTemplateEntry(
    "tutorial_thumbnail",
    "Stored Tutorial Title",
  );
  const outroEntry = createTemplateEntry("outro_thumbnail", "Stored Outro");

  const result = resolveTemplateSelection({
    entries: [tutorialEntry, outroEntry],
    nextTemplateId: "tutorial_thumbnail",
    createEntry: () =>
      createTemplateEntry("tutorial_thumbnail", "Fresh Tutorial Title"),
  });

  assert.equal(result.activeEntry.fieldValues.title, "Stored Tutorial Title");
  assert.equal(result.templateEntries.length, 2);
});

test("resolveTemplateSelection seeds a new template entry when the banner does not have that template yet", () => {
  const tutorialEntry = createTemplateEntry(
    "tutorial_thumbnail",
    "Stored Tutorial Title",
  );

  const result = resolveTemplateSelection({
    entries: [tutorialEntry],
    nextTemplateId: "intro_bite_thumbnail",
    createEntry: () =>
      createTemplateEntry("intro_bite_thumbnail", "Fresh Intro Bite"),
  });

  assert.equal(result.activeEntry.templateId, "intro_bite_thumbnail");
  assert.equal(result.activeEntry.fieldValues.title, "Fresh Intro Bite");
  assert.deepEqual(
    result.templateEntries.map((entry) => entry.templateId),
    ["tutorial_thumbnail", "intro_bite_thumbnail"],
  );
});

test("normalizeTemplateEntries replaces an existing template entry with the latest active values", () => {
  const staleIntroBiteEntry = createTemplateEntry(
    "intro_bite_thumbnail",
    "Stale Intro Bite Title",
    {
      fieldValues: {
        title: "Stale Intro Bite Title",
        source_label: "BITE FROM",
        source_title: "Old Source Video",
        motion_duration_seconds: "3",
      },
      borderWidth: 18,
      borderColor: "#22d3ee",
      fontSize: 96,
    },
  );
  const tutorialEntry = createTemplateEntry(
    "tutorial_thumbnail",
    "Stored Tutorial Title",
  );
  const latestIntroBiteEntry = createTemplateEntry(
    "intro_bite_thumbnail",
    "Fresh Intro Bite Title",
    {
      fieldValues: {
        title: "Fresh Intro Bite Title",
        source_label: "BITE FROM",
        source_title: "Fresh Source Video",
        motion_duration_seconds: "7",
      },
      borderWidth: 42,
      borderColor: "#f97316",
      fontSize: 112,
    },
  );

  const normalized = normalizeTemplateEntries(
    [tutorialEntry, staleIntroBiteEntry],
    latestIntroBiteEntry,
  );
  const introBiteEntry = normalized.find(
    (entry) => entry.templateId === "intro_bite_thumbnail",
  );

  assert.equal(normalized.length, 2);
  assert.ok(introBiteEntry);
  assert.equal(introBiteEntry.fieldValues.title, "Fresh Intro Bite Title");
  assert.equal(introBiteEntry.fieldValues.source_title, "Fresh Source Video");
  assert.equal(introBiteEntry.fieldValues.motion_duration_seconds, "7");
  assert.equal(introBiteEntry.borderWidth, 42);
  assert.equal(introBiteEntry.borderColor, "#f97316");
  assert.equal(introBiteEntry.fontSize, 112);
});

test("normalizeTemplateEntries preserves persisted outro arrow overlays on the latest outro entry", () => {
  const staleOutroEntry = createTemplateEntry(
    "outro_thumbnail",
    "Stale Outro",
    {
      fieldValues: {
        title: "Stale Outro",
        subtitle: "Old support line",
      },
      ...({
        outroArrowOverlays: [
          {
            id: "stale-arrow",
            type: "subscribe",
            text: "SUBSCRIBE",
            x: 40,
            y: 62,
            degree: 0,
            isInverse: false,
            textSize: 100,
            arrowSize: 100,
            isBold: false,
            isItalic: false,
            thickness: "regular",
          },
        ],
      } as any),
    },
  );
  const latestOutroEntry = createTemplateEntry(
    "outro_thumbnail",
    "Fresh Outro",
    {
      fieldValues: {
        title: "Fresh Outro",
        subtitle: "Fresh support line",
      },
      ...({
        outroArrowOverlays: [
          {
            id: "arrow-1",
            type: "next_bite_size",
            text: "NEXT BITE-SIZE",
            x: 58,
            y: 70,
            degree: 12,
            isInverse: false,
            textSize: 132,
            arrowSize: 118,
            isBold: true,
            isItalic: false,
            thickness: "thick",
          },
          {
            id: "arrow-2",
            type: "course",
            text: "COURSE",
            x: 84,
            y: 76,
            degree: 318,
            isInverse: true,
            textSize: 88,
            arrowSize: 96,
            isBold: false,
            isItalic: true,
            thickness: "thin",
          },
        ],
      } as any),
    },
  );

  const normalized = normalizeTemplateEntries(
    [staleOutroEntry],
    latestOutroEntry,
  );
  const outroEntry = normalized.find(
    (entry) => entry.templateId === "outro_thumbnail",
  );

  assert.ok(outroEntry);
  assert.deepEqual((outroEntry as any).outroArrowOverlays, [
    {
      id: "arrow-1",
      type: "next_bite_size",
      text: "NEXT BITE-SIZE",
      x: 58,
      y: 70,
      degree: 12,
      isInverse: false,
      textSize: 132,
      arrowSize: 118,
      isBold: true,
      isItalic: false,
      thickness: "thick",
    },
    {
      id: "arrow-2",
      type: "course",
      text: "COURSE",
      x: 84,
      y: 76,
      degree: 318,
      isInverse: true,
      textSize: 88,
      arrowSize: 96,
      isBold: false,
      isItalic: true,
      thickness: "thin",
    },
  ]);
});
