import { normalizeAssetTags } from "../persistence/assetPersistence";

export function parseAssetTagInput(value: string): string[] {
  return normalizeAssetTags(value.split(","));
}

export function buildAssetSearchToken(prefix: "#", value: string): string {
  const normalizedValue = value.trim().toLowerCase();

  return `${prefix}${normalizedValue}`;
}

export function appendAssetSearchToken(
  searchText: string,
  token: string,
): string {
  const normalizedSearchText = searchText.trim();

  if (normalizedSearchText.split(/\s+/).includes(token)) {
    return normalizedSearchText;
  }

  return `${normalizedSearchText} ${token}`.trim();
}
