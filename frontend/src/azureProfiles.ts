export type AzureProfile = "Dev" | "Prod";

export const AZURE_TABLE_PREFIX = "Banners";
export const AZURE_PROFILE_VALUES: AzureProfile[] = ["Dev", "Prod"];

export function normalizeAzureProfile(
  value: string | null | undefined,
): AzureProfile {
  return value?.trim().toLowerCase() === "prod" ? "Prod" : "Dev";
}

export function buildAzureTableName(profile: AzureProfile): string {
  return `${AZURE_TABLE_PREFIX}${profile}`;
}

export function detectAzureProfileFromTableName(
  tableName: string | null | undefined,
): AzureProfile | null {
  const normalizedTableName = tableName?.trim().toLowerCase();
  if (normalizedTableName === "bannersdev") {
    return "Dev";
  }

  if (normalizedTableName === "bannersprod") {
    return "Prod";
  }

  return null;
}

export function resolveDefaultAzureProfile(): AzureProfile {
  return import.meta.env?.PROD ? "Prod" : "Dev";
}
