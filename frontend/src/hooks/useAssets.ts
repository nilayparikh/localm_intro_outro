import { useCallback, useMemo } from "react";
import { useAzureCachedCollection, type CachedCrudCollection } from "@common";
import { useDatabaseContext } from "../db";
import { useAuth } from "../auth";
import {
  ASSET_SORT,
  createAssetRemoteAdapter,
  formatAssetOptionLabel,
  normalizeAssetCategory,
  normalizeAssetTags,
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

export interface AssetFilterOptions {
  searchText?: string;
  kind?: AssetKind | "all";
  tags?: string[];
}

function normalizeSearchText(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export interface ParsedAssetSearchQuery {
  text: string;
  tags: string[];
}

export function parseAssetSearchQuery(query: string): ParsedAssetSearchQuery {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  const textTokens: string[] = [];
  const tags: string[] = [];

  for (const token of tokens) {
    if (token.startsWith("#") && token.length > 1) {
      tags.push(token.slice(1));
      continue;
    }

    if (token.startsWith("@") && token.length > 1) {
      continue;
    }

    textTokens.push(token);
  }

  return {
    text: normalizeSearchText(textTokens.join(" ")),
    tags: normalizeAssetTags(tags),
  };
}

export function collectAssetTags(assets: AssetDoc[]): string[] {
  return [
    ...new Set(assets.flatMap((asset) => normalizeAssetTags(asset.tags))),
  ].sort((left, right) => left.localeCompare(right));
}

export function collectAssetCategories(assets: AssetDoc[]): string[] {
  return [
    ...new Set(
      assets
        .map((asset) => normalizeAssetCategory(asset.category))
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

export function filterAssets(
  assets: AssetDoc[],
  { searchText = "", kind = "all", tags = [] }: AssetFilterOptions,
): AssetDoc[] {
  const parsedQuery = parseAssetSearchQuery(searchText);
  const normalizedSearchText = parsedQuery.text;
  const normalizedTags = normalizeAssetTags([...parsedQuery.tags, ...tags]);

  return sortAssets(
    assets.filter((asset) => {
      const assetTags = normalizeAssetTags(asset.tags);
      const matchesKind = kind === "all" || asset.kind === kind;
      const matchesSearch =
        normalizedSearchText.length === 0 ||
        asset.name.toLowerCase().includes(normalizedSearchText) ||
        asset.fileName.toLowerCase().includes(normalizedSearchText);
      const matchesTags = normalizedTags.every((tag) =>
        assetTags.includes(tag),
      );

      return matchesKind && matchesSearch && matchesTags;
    }),
  );
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

  const assets = useMemo(
    () =>
      sortAssets(
        records.map((record) => ({
          ...record,
          category: normalizeAssetCategory(record.category),
          tags: normalizeAssetTags(record.tags),
        })),
      ),
    [records],
  );

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
