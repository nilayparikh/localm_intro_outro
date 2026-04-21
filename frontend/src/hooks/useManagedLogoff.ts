import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  createAzureCachedCollectionApi,
  type CachedCrudCollection,
} from "@common";
import { useAuth } from "../auth";
import { useDatabaseContext } from "../db";
import { useAppState } from "./useAppState";
import {
  createBannerRemoteAdapter,
  prepareBannerForSave,
  type BannerDoc,
  type BannerSaveInput,
} from "../persistence/bannerPersistence";

export function useManagedLogoff() {
  const { authState, logoff } = useAuth();
  const db = useDatabaseContext();
  const { appState, updateAppState } = useAppState();
  const bannerApi = useMemo(
    () =>
      createAzureCachedCollectionApi<BannerDoc, BannerSaveInput>({
        collection: db.banners as unknown as CachedCrudCollection<BannerDoc>,
        remote: authState ? createBannerRemoteAdapter(authState) : null,
        prepareForSave: prepareBannerForSave,
      }),
    [authState, db],
  );

  return useCallback(async () => {
    if (
      appState.autoSaveOnLogout &&
      appState.draftDirty &&
      appState.currentDraft
    ) {
      const draft = appState.currentDraft;
      const name =
        draft.name.trim() || `Recovery Draft ${new Date().toISOString()}`;
      const savedBanner = await bannerApi.save({
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
        showCopyrightMessage: draft.showCopyrightMessage,
        copyrightText: draft.copyrightText,
        tutorialImageUrl: draft.tutorialImageUrl,
        tutorialImageSize: draft.tutorialImageSize,
        tutorialImageBottomPadding: draft.tutorialImageBottomPadding,
        tutorialImageOpacity: draft.tutorialImageOpacity,
      });
      const bannerId = savedBanner.id;

      await updateAppState({
        currentDraft: { ...draft, bannerId: bannerId ?? draft.bannerId, name },
        draftDirty: false,
      });
      toast.success(`Auto-saved \"${name}\" before log off`);
    }

    logoff();
  }, [appState, bannerApi, logoff, updateAppState]);
}
