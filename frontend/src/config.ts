import {
  buildAzureTableName,
  resolveDefaultAzureProfile,
} from "./azureProfiles";

/**
 * Azure Storage configuration — non-secret endpoints only.
 * Secrets (SAS tokens) are stored in browser sessionStorage.
 */
const defaultAzureProfile = resolveDefaultAzureProfile();

export const AZURE_CONFIG = {
  profile: defaultAzureProfile,
  storageAccountName: "satutslocalm",
  tableEndpoint: "https://satutslocalm.table.core.windows.net",
  tableName: buildAzureTableName(defaultAzureProfile),
  blobEndpoint: "https://satutslocalm.blob.core.windows.net",
  blobContainerName: "banner",
} as const;

/** sessionStorage keys for secrets */
export const SECRET_KEYS = {
  AUTH_STATE: "localm_banners_auth_state",
  SAS_TOKEN: "localm_banners_sas_token",
} as const;

/** App metadata */
export const APP_CONFIG = {
  name: "LocalM™ Banners",
  version: "1.0.0",
} as const;
