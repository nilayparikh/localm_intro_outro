import { useCallback, useMemo } from "react";
import { useAzureCachedCollection, type CachedCrudCollection } from "@common";
import { useDatabaseContext } from "../db";
import { useAuth } from "../auth";
import {
  ASSET_SORT,
  createAssetRemoteAdapter,
  formatAssetOptionLabel,
  prepareAssetForSave,
  type AssetDoc,
  type AssetKind,
  type AssetSaveInput,
} from "../persistence/assetPersistence";

export type {
  AssetDoc,
  AssetKind,
  AssetSaveInput,
} from "../persistence/assetPersistence";

function compareAssets(left: AssetDoc, right: AssetDoc): number {
  if (left.updatedAt !== right.updatedAt) {
    return right.updatedAt - left.updatedAt;
  }

  return left.name.localeCompare(right.name);
}

export function sortAssets(assets: AssetDoc[]): AssetDoc[] {
  return [...assets].sort(compareAssets);
}

export function buildAssetOptions(
  assets: AssetDoc[],
  kind?: AssetKind,
): Array<{ value: string; label: string }> {
  const filteredAssets = kind
    ? assets.filter((asset) => asset.kind === kind)
    : assets;

  return sortAssets(filteredAssets).map((asset) => ({
    value: asset.id,
    label: formatAssetOptionLabel(asset),
  }));
}

export function useAssets() {
  const db = useDatabaseContext();
  const { authState } = useAuth();
  const remote = useMemo(
    () => (authState ? createAssetRemoteAdapter(authState) : null),
    [authState],
  );
  const { records, save, remove, get, refresh } = useAzureCachedCollection<
    AssetDoc,
    AssetSaveInput
  >({
    collection: db.assets as unknown as CachedCrudCollection<AssetDoc>,
    remote,
    loadStrategy: remote ? "remote-first" : "cache-first",
    prepareForSave: prepareAssetForSave,
    sort: ASSET_SORT,
  });

  const assets = useMemo(() => sortAssets(records), [records]);

  const saveAsset = useCallback(
    async (input: AssetSaveInput) => {
      const savedAsset = await save(input);
      return savedAsset.id;
    },
    [save],
  );

  const deleteAsset = useCallback(
    async (assetId: string) => {
      await remove(assetId);
    },
    [remove],
  );

  const assetOptions = useMemo(() => buildAssetOptions(assets), [assets]);
  const audioAssetOptions = useMemo(
    () => buildAssetOptions(assets, "audio"),
    [assets],
  );

  return {
    assets,
    assetOptions,
    audioAssetOptions,
    saveAsset,
    deleteAsset,
    getAsset: get,
    refreshAssets: refresh,
  };
}
