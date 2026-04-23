import test from "node:test";
import assert from "node:assert/strict";
import { runManagedLogoff } from "../../src/hooks/managedLogoff";

const draft = {
  bannerId: "banner-1",
  name: "Draft Banner",
  templateId: "tutorial_thumbnail",
  themeId: "dark",
  platformId: "landscape_4k",
  fieldValues: { title: "Draft Title" },
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
  templateEntries: [],
};

test("runManagedLogoff always clears the session even when auto-save fails", async () => {
  const events: string[] = [];

  await runManagedLogoff({
    autoSaveOnLogout: true,
    draftDirty: true,
    currentDraft: draft as any,
    saveDraft: async () => {
      events.push("save");
      throw new Error("AuthenticationFailed");
    },
    updateDraftAfterSave: async () => {
      events.push("update");
    },
    logoff: () => {
      events.push("logoff");
    },
    notifySaved: () => {
      events.push("saved-toast");
    },
    notifySaveFailed: () => {
      events.push("failed-toast");
    },
  });

  assert.deepEqual(events, ["save", "failed-toast", "logoff"]);
});
