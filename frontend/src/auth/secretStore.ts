import { SECRET_KEYS, AZURE_CONFIG } from "../config";
import {
  buildAzureTableName,
  detectAzureProfileFromTableName,
  normalizeAzureProfile,
} from "../azureProfiles";
import type { StoredAuthState } from "./credentials";

interface SecretStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

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

function getSessionSecretStorage(): SecretStorageLike | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  return sessionStorage;
}

function getPersistentSecretStorage(): SecretStorageLike | null {
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }

  return getSessionSecretStorage();
}

function getAllSecretStorages(): SecretStorageLike[] {
  const persistentStorage = getPersistentSecretStorage();
  const sessionSecretStorage = getSessionSecretStorage();

  return [persistentStorage, sessionSecretStorage].filter(
    (storage, index, storages): storage is SecretStorageLike =>
      storage !== null && storages.indexOf(storage) === index,
  );
}

function removeSecretKeyEverywhere(key: string): void {
  for (const storage of getAllSecretStorages()) {
    storage.removeItem(key);
  }
}

function parseStoredAuthState(raw: string | null): StoredAuthState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isStoredAuthState(parsed)) {
      return normalizeStoredAuthState(parsed);
    }
  } catch {
    return null;
  }

  return null;
}

function migrateLegacyStateIfNeeded(value: StoredAuthState): StoredAuthState {
  setStoredAuthState(value);
  return value;
}

export function getSecret(key: string): string | null {
  for (const storage of getAllSecretStorages()) {
    const value = storage.getItem(key);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

export function setSecret(key: string, value: string): void {
  const storage = getPersistentSecretStorage();
  if (!storage) {
    return;
  }

  storage.setItem(key, value);

  const sessionSecretStorage = getSessionSecretStorage();
  if (sessionSecretStorage && sessionSecretStorage !== storage) {
    sessionSecretStorage.removeItem(key);
  }
}

export function getStoredAuthState(): StoredAuthState | null {
  const persistentStorage = getPersistentSecretStorage();
  const persistentValue = parseStoredAuthState(
    persistentStorage?.getItem(SECRET_KEYS.AUTH_STATE) ?? null,
  );
  if (persistentValue) {
    return persistentValue;
  }

  const sessionSecretStorage = getSessionSecretStorage();
  const sessionValue = parseStoredAuthState(
    sessionSecretStorage?.getItem(SECRET_KEYS.AUTH_STATE) ?? null,
  );
  if (sessionValue) {
    return migrateLegacyStateIfNeeded(sessionValue);
  }

  const legacySasToken =
    persistentStorage?.getItem(SECRET_KEYS.SAS_TOKEN) ??
    sessionSecretStorage?.getItem(SECRET_KEYS.SAS_TOKEN) ??
    null;
  if (!legacySasToken) {
    return null;
  }

  return migrateLegacyStateIfNeeded({
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
  });
}

export function setStoredAuthState(value: StoredAuthState): void {
  const storage = getPersistentSecretStorage();
  if (!storage) {
    return;
  }

  storage.setItem(SECRET_KEYS.AUTH_STATE, JSON.stringify(value));

  if (value.mode === "sas-token") {
    storage.setItem(SECRET_KEYS.SAS_TOKEN, value.sasToken);
  } else if (value.mode === "connection-string") {
    storage.setItem(SECRET_KEYS.SAS_TOKEN, value.sharedAccessSignature);
  } else {
    storage.removeItem(SECRET_KEYS.SAS_TOKEN);
  }

  const sessionSecretStorage = getSessionSecretStorage();
  if (sessionSecretStorage && sessionSecretStorage !== storage) {
    sessionSecretStorage.removeItem(SECRET_KEYS.AUTH_STATE);
    sessionSecretStorage.removeItem(SECRET_KEYS.SAS_TOKEN);
  }
}

export function clearSecrets(): void {
  Object.values(SECRET_KEYS).forEach((key) => {
    removeSecretKeyEverywhere(key);
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
