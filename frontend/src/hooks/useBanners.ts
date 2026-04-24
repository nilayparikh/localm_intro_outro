import { useMemo } from "react";
import { useAzureCachedCollection, type CachedCrudCollection } from "@common";
import { useDatabaseContext } from "../db";
import { useAuth } from "../auth";
import {
  BANNER_SORT,
  createBannerRemoteAdapter,
  prepareBannerForSave,
  type BannerDoc,
  type BannerSaveInput,
} from "../persistence/bannerPersistence";

export type { BannerDoc } from "../persistence/bannerPersistence";

export function useBanners() {
  const db = useDatabaseContext();
  const { authState } = useAuth();
  const remote = useMemo(
    () => (authState ? createBannerRemoteAdapter(authState) : null),
    [authState],
  );
  const {
    records: banners,
    save,
    remove,
    get,
    refresh,
  } = useAzureCachedCollection<BannerDoc, BannerSaveInput>({
    collection: db.banners as unknown as CachedCrudCollection<BannerDoc>,
    remote,
    loadStrategy: remote ? "remote-first" : "cache-first",
    reconcileStrategy: remote ? "merge-remote" : "mirror-remote",
    prepareForSave: prepareBannerForSave,
    sort: BANNER_SORT,
  });

  const saveBanner = useMemo(
    () => async (data: BannerSaveInput) => {
      const savedBanner = await save(data);
      return savedBanner.id;
    },
    [save],
  );

  return {
    banners,
    saveBanner,
    deleteBanner: remove,
    getBanner: get,
    refreshBanners: refresh,
  };
}
