import { SECRET_KEYS, AZURE_CONFIG } from "../config";
import {
  buildAzureTableName,
  detectAzureProfileFromTableName,
  normalizeAzureProfile,
} from "../azureProfiles";
import type { StoredAuthState } from "./credentials";

function normalizeConnection(connection: any) {
  const storedTableName = connection?.tableName?.trim();
  const profile = normalizeAzureProfile(
    connection?.profile ??
      detectAzureProfileFromTableName(storedTableName) ??
      AZURE_CONFIG.profile,
  );

  return {
    profile,
    storageAccountName:
      connection?.storageAccountName ?? AZURE_CONFIG.storageAccountName,
    tableEndpoint: connection?.tableEndpoint ?? AZURE_CONFIG.tableEndpoint,
    tableName:
      storedTableName && storedTableName.toLowerCase() !== "banners"
        ? storedTableName
        : buildAzureTableName(profile),
    blobEndpoint:
      connection?.blobEndpoint ??
      connection?.fileShareEndpoint ??
      AZURE_CONFIG.blobEndpoint,
    blobContainerName:
      connection?.blobContainerName ??
      connection?.fileShareName ??
      AZURE_CONFIG.blobContainerName,
  };
}

function normalizeStoredAuthState(value: any): StoredAuthState {
  return {
    ...value,
    connection: normalizeConnection(value.connection),
  } as StoredAuthState;
}

function isStoredAuthState(value: unknown): value is StoredAuthState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const mode = (value as { mode?: string }).mode;
  return (
    mode === "sas-token" ||
    mode === "connection-string" ||
    mode === "access-token"
  );
}

export function getSecret(key: string): string | null {
  return sessionStorage.getItem(key);
}

export function setSecret(key: string, value: string): void {
  sessionStorage.setItem(key, value);
}

export function getStoredAuthState(): StoredAuthState | null {
  const raw = sessionStorage.getItem(SECRET_KEYS.AUTH_STATE);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isStoredAuthState(parsed)) {
        return normalizeStoredAuthState(parsed);
      }
    } catch {
      sessionStorage.removeItem(SECRET_KEYS.AUTH_STATE);
    }
  }

  const legacySasToken = sessionStorage.getItem(SECRET_KEYS.SAS_TOKEN);
  if (!legacySasToken) {
    return null;
  }

  return {
    mode: "sas-token",
    connection: {
      profile: AZURE_CONFIG.profile,
      storageAccountName: AZURE_CONFIG.storageAccountName,
      tableEndpoint: AZURE_CONFIG.tableEndpoint,
      tableName: AZURE_CONFIG.tableName,
      blobEndpoint: AZURE_CONFIG.blobEndpoint,
      blobContainerName: AZURE_CONFIG.blobContainerName,
    },
    sasToken: legacySasToken,
  };
}

export function setStoredAuthState(value: StoredAuthState): void {
  sessionStorage.setItem(SECRET_KEYS.AUTH_STATE, JSON.stringify(value));

  if (value.mode === "sas-token") {
    sessionStorage.setItem(SECRET_KEYS.SAS_TOKEN, value.sasToken);
  } else if (value.mode === "connection-string") {
    sessionStorage.setItem(SECRET_KEYS.SAS_TOKEN, value.sharedAccessSignature);
  } else {
    sessionStorage.removeItem(SECRET_KEYS.SAS_TOKEN);
  }
}

export function clearSecrets(): void {
  Object.values(SECRET_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

export function hasSecrets(): boolean {
  return getStoredAuthState() !== null;
}

export function requireSasToken(): string {
  const authState = getStoredAuthState();
  if (!authState) {
    throw new Error("Storage credentials not configured. Please log in.");
  }

  if (authState.mode === "access-token") {
    throw new Error(
      "Current login uses an access token instead of a SAS token.",
    );
  }

  return authState.mode === "sas-token"
    ? authState.sasToken
    : authState.sharedAccessSignature;
}
