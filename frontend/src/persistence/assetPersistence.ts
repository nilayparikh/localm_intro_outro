import { v4 as uuidv4 } from "uuid";
import type { StoredAuthState } from "../auth";
import { createAzureTableCrudAdapter } from "./azureCollectionAdapters";

export type AssetKind = "audio" | "video" | "image" | "file";

export interface AssetDoc {
  id: string;
  name: string;
  fileName: string;
  kind: AssetKind;
  mimeType: string;
  blobPath: string;
  sizeBytes: number;
  durationMs: number | null;
  previewImagePath: string | null;
  width: number | null;
  height: number | null;
  category: string;
  tags: string[];
  updatedAt: number;
}

export type AssetSaveInput = Omit<
  AssetDoc,
  "id" | "updatedAt" | "tags" | "category"
> & {
  id?: string;
  category?: string;
  tags?: string[];
};

export const ASSET_SORT: Array<Record<string, "asc" | "desc">> = [
  { updatedAt: "desc" },
];

function slugifyFileStem(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "asset"
  );
}

function normalizeExtension(fileName: string): string {
  const rawExtension = fileName.includes(".")
    ? fileName.split(".").pop()?.trim().toLowerCase()
    : "";

  return rawExtension && /^[a-z0-9]+$/.test(rawExtension)
    ? rawExtension
    : "bin";
}

export function classifyAssetKind(mimeType: string): AssetKind {
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  return "file";
}

export function buildAssetBlobPath({
  fileName,
  kind,
  timestamp = Date.now(),
}: {
  fileName: string;
  kind: AssetKind;
  timestamp?: number;
}): string {
  const extension = normalizeExtension(fileName);
  const rawStem = fileName.replace(/\.[^.]+$/, "");
  const safeStem = slugifyFileStem(rawStem);

  return `assets/${kind}/${timestamp}-${safeStem}.${extension}`;
}

function formatDuration(durationMs: number): string {
  const totalSeconds = durationMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  return `${String(minutes).padStart(2, "0")}:${seconds
    .toFixed(1)
    .padStart(4, "0")}`;
}

export function formatAssetOptionLabel({
  name,
  fileName,
  durationMs,
}: Pick<AssetDoc, "name" | "fileName" | "durationMs">): string {
  const baseLabel = `${name} [${fileName}]`;

  if (typeof durationMs === "number" && Number.isFinite(durationMs)) {
    return `${baseLabel} | ${formatDuration(durationMs)}`;
  }

  return baseLabel;
}

export function normalizeAssetTags(tags: string[] | undefined): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const uniqueTags = new Set<string>();
  const normalizedTags: string[] = [];

  for (const tag of tags) {
    const normalizedTag = tag.trim().replace(/\s+/g, " ").toLowerCase();

    if (!normalizedTag || uniqueTags.has(normalizedTag)) {
      continue;
    }

    uniqueTags.add(normalizedTag);
    normalizedTags.push(normalizedTag);
  }

  return normalizedTags;
}

export function normalizeAssetCategory(
  category: string | undefined | null,
): string {
  return category?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

export function normalizeAssetCategoryKey(
  category: string | undefined | null,
): string {
  return normalizeAssetCategory(category)
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function prepareAssetForSave(input: AssetSaveInput): AssetDoc {
  return {
    ...input,
    id: input.id ?? uuidv4(),
    name: input.name.trim(),
    fileName: input.fileName.trim(),
    blobPath: input.blobPath.replace(/^\/+/, ""),
    sizeBytes: Math.max(0, Math.round(input.sizeBytes)),
    durationMs:
      typeof input.durationMs === "number" && Number.isFinite(input.durationMs)
        ? Math.max(0, Math.round(input.durationMs))
        : null,
    previewImagePath: input.previewImagePath?.replace(/^\/+/, "") ?? null,
    width:
      typeof input.width === "number" && Number.isFinite(input.width)
        ? Math.max(0, Math.round(input.width))
        : null,
    height:
      typeof input.height === "number" && Number.isFinite(input.height)
        ? Math.max(0, Math.round(input.height))
        : null,
    category: normalizeAssetCategory(input.category),
    tags: normalizeAssetTags(input.tags),
    updatedAt: Date.now(),
  };
}

export function createAssetRemoteAdapter(authState: StoredAuthState) {
  return createAzureTableCrudAdapter<AssetDoc>("assets", authState);
}
