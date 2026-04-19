import { useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../auth";
import { useAppState } from "./useAppState";
import { useBanners } from "./useBanners";

export function useManagedLogoff() {
  const { logoff } = useAuth();
  const { appState, updateAppState } = useAppState();
  const { saveBanner } = useBanners();

  return useCallback(async () => {
    if (
      appState.autoSaveOnLogout &&
      appState.draftDirty &&
      appState.currentDraft
    ) {
      const draft = appState.currentDraft;
      const name =
        draft.name.trim() || `Recovery Draft ${new Date().toISOString()}`;
      const bannerId = await saveBanner({
        id: draft.bannerId ?? undefined,
        name,
        templateId: draft.templateId,
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
        tutorialImageUrl: draft.tutorialImageUrl,
        tutorialImageSize: draft.tutorialImageSize,
        tutorialImageBottomPadding: draft.tutorialImageBottomPadding,
        tutorialImageOpacity: draft.tutorialImageOpacity,
      });

      await updateAppState({
        currentDraft: { ...draft, bannerId: bannerId ?? draft.bannerId, name },
        draftDirty: false,
      });
      toast.success(`Auto-saved \"${name}\" before log off`);
    }

    logoff();
  }, [appState, logoff, saveBanner, updateAppState]);
}
