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
import { runManagedLogoff } from "./managedLogoff";

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
    await runManagedLogoff({
      autoSaveOnLogout: appState.autoSaveOnLogout,
      draftDirty: appState.draftDirty,
      currentDraft: appState.currentDraft,
      saveDraft: bannerApi.save,
      updateDraftAfterSave: async (draft) => {
        await updateAppState({
          currentDraft: draft,
          draftDirty: false,
        });
      },
      logoff,
      notifySaved: (name) => {
        toast.success(`Auto-saved "${name}" before log off`);
      },
      notifySaveFailed: (message) => {
        toast.error(message);
      },
    });
  }, [appState, bannerApi, logoff, updateAppState]);
}
