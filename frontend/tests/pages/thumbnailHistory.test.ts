import test from "node:test";
import assert from "node:assert/strict";
import {
  createThumbnailHistory,
  pushThumbnailHistory,
  redoThumbnailHistory,
  undoThumbnailHistory,
} from "../../src/pages/thumbnailHistory";
import type { DraftBannerState } from "../../src/hooks/useAppState";

function createDraft(
  overrides: Partial<DraftBannerState> = {},
): DraftBannerState {
  return {
    bannerId: "banner-1",
    name: "Release Smoke Draft",
    templateId: "outro_thumbnail",
    templateEntries: [],
    themeId: "dark",
    platformId: "landscape_4k",
    fieldValues: {
      title: "First Title",
      subtitle: "Support line",
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
    outroArrowOverlays: [],
    ...overrides,
  };
}

test("thumbnail history pushes new snapshots, undoes, redoes, and drops stale redo entries", () => {
  const first = createDraft();
  const second = createDraft({
    fieldValues: {
      title: "Second Title",
      subtitle: "Support line",
    },
  });
  const third = createDraft({
    fieldValues: {
      title: "Third Title",
      subtitle: "Support line",
    },
  });

  const baseHistory = createThumbnailHistory(first);
  const withSecond = pushThumbnailHistory(baseHistory, second);
  const withThird = pushThumbnailHistory(withSecond, third);
  const afterUndo = undoThumbnailHistory(withThird);
  const afterRedo = redoThumbnailHistory(afterUndo);
  const branched = pushThumbnailHistory(
    afterUndo,
    createDraft({
      fieldValues: {
        title: "Branched Title",
        subtitle: "Support line",
      },
    }),
  );

  assert.equal(withThird.entries.length, 3);
  assert.equal(withThird.index, 2);
  assert.equal(afterUndo.snapshot.fieldValues.title, "Second Title");
  assert.equal(afterUndo.index, 1);
  assert.equal(afterRedo.snapshot.fieldValues.title, "Third Title");
  assert.equal(afterRedo.index, 2);
  assert.equal(branched.entries.length, 3);
  assert.equal(branched.index, 2);
  assert.equal(branched.entries[2]?.fieldValues.title, "Branched Title");
});

test("thumbnail history ignores duplicate snapshots", () => {
  const first = createDraft();
  const history = createThumbnailHistory(first);
  const unchanged = pushThumbnailHistory(history, createDraft());

  assert.equal(unchanged.entries.length, 1);
  assert.equal(unchanged.index, 0);
  assert.equal(unchanged.snapshot.fieldValues.title, "First Title");
});
