import {
  buildAzureTableName,
  resolveDefaultAzureProfile,
} from "./azureProfiles";

/**
 * Azure Storage configuration — non-secret endpoints only.
 * Secrets are stored in browser storage for automatic reconnects until log off.
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

/** Browser storage keys for auth state and SAS helpers */
export const SECRET_KEYS = {
  AUTH_STATE: "localm_intro_outro_auth_state",
  SAS_TOKEN: "localm_intro_outro_sas_token",
} as const;

/** App metadata */
export const APP_CONFIG = {
  name: "LocalM™ Intro Outro",
  version: "1.0.0",
} as const;
