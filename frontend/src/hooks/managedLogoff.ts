import type {
  BannerDoc,
  BannerSaveInput,
} from "../persistence/bannerPersistence";

export type ManagedLogoffDraft = Omit<BannerSaveInput, "id"> & {
  bannerId: string | null;
};

interface RunManagedLogoffOptions {
  autoSaveOnLogout: boolean;
  draftDirty: boolean;
  currentDraft: ManagedLogoffDraft | null;
  saveDraft: (draft: BannerSaveInput) => Promise<Pick<BannerDoc, "id">>;
  updateDraftAfterSave: (draft: ManagedLogoffDraft) => Promise<void>;
  logoff: () => void;
  notifySaved: (name: string) => void;
  notifySaveFailed: (message: string) => void;
}

function buildBannerSaveInput(
  draft: ManagedLogoffDraft,
  name: string,
): BannerSaveInput {
  return {
    id: draft.bannerId ?? undefined,
    name,
    templateId: draft.templateId,
    templateEntries: draft.templateEntries,
    themeId: draft.themeId,
    platformId: draft.platformId,
    fieldValues: draft.fieldValues,
    borderWidth: draft.borderWidth,
    borderColor: draft.borderColor,
    fontPairId: draft.fontPairId,
    primaryFontFamily: draft.primaryFontFamily,
    secondaryFontFamily: draft.secondaryFontFamily,
    fontSize: draft.fontSize,
    brandLogoUrl: draft.brandLogoUrl,
    brandLogoSize: draft.brandLogoSize,
    showCopyrightMessage: draft.showCopyrightMessage,
    copyrightText: draft.copyrightText,
    tutorialImageUrl: draft.tutorialImageUrl,
    tutorialImageSize: draft.tutorialImageSize,
    tutorialImageBottomPadding: draft.tutorialImageBottomPadding,
    tutorialImageOpacity: draft.tutorialImageOpacity,
  };
}

export async function runManagedLogoff({
  autoSaveOnLogout,
  draftDirty,
  currentDraft,
  saveDraft,
  updateDraftAfterSave,
  logoff,
  notifySaved,
  notifySaveFailed,
}: RunManagedLogoffOptions): Promise<void> {
  try {
    if (autoSaveOnLogout && draftDirty && currentDraft) {
      const name =
        currentDraft.name.trim() ||
        `Recovery Draft ${new Date().toISOString()}`;
      const savedBanner = await saveDraft(
        buildBannerSaveInput(currentDraft, name),
      );

      await updateDraftAfterSave({
        ...currentDraft,
        bannerId: savedBanner.id ?? currentDraft.bannerId,
        name,
      });
      notifySaved(name);
    }
  } catch (error) {
    console.error("Auto-save before log off failed:", error);
    notifySaveFailed("Couldn't auto-save before log off.");
  } finally {
    logoff();
  }
}
