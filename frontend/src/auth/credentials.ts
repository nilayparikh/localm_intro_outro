import { AZURE_CONFIG } from "../config";
import {
  buildAzureTableName,
  normalizeAzureProfile,
  type AzureProfile,
} from "../azureProfiles";

export type AuthMode = "sas-token" | "connection-string" | "access-token";

export interface ConnectionDetails {
  profile: AzureProfile;
  storageAccountName: string;
  tableEndpoint: string;
  tableName: string;
  blobEndpoint: string;
  blobContainerName: string;
}

export interface AuthFormValues {
  mode: AuthMode;
  sasToken: string;
  connectionString: string;
  accessToken: string;
  connection: ConnectionDetails;
}

interface BaseStoredAuthState {
  connection: ConnectionDetails;
}

export type StoredAuthState =
  | ({
      mode: "sas-token";
      sasToken: string;
    } & BaseStoredAuthState)
  | ({
      mode: "connection-string";
      connectionString: string;
      sharedAccessSignature: string;
    } & BaseStoredAuthState)
  | ({
      mode: "access-token";
      accessToken: string;
    } & BaseStoredAuthState);

export type ResolvedStorageAuth =
  | {
      kind: "sas";
      connection: ConnectionDetails;
      sasToken: string;
    }
  | {
      kind: "bearer";
      connection: ConnectionDetails;
      accessToken: string;
    };

type ValidationResult =
  | { ok: true; authState: StoredAuthState }
  | { ok: false; error: string };

interface ParsedConnectionString {
  accountName: string | null;
  sharedAccessSignature: string | null;
  accountKey: string | null;
  tableEndpoint: string | null;
  blobEndpoint: string | null;
}

type ConnectionValidationResult =
  | { ok: true; connection: ConnectionDetails }
  | { ok: false; error: string };

export const DEFAULT_CONNECTION_DETAILS: ConnectionDetails = {
  profile: AZURE_CONFIG.profile,
  storageAccountName: AZURE_CONFIG.storageAccountName,
  tableEndpoint: AZURE_CONFIG.tableEndpoint,
  tableName: AZURE_CONFIG.tableName,
  blobEndpoint: AZURE_CONFIG.blobEndpoint,
  blobContainerName: AZURE_CONFIG.blobContainerName,
};

export const DEFAULT_AUTH_FORM_VALUES: AuthFormValues = {
  mode: "sas-token",
  sasToken: "",
  connectionString: "",
  accessToken: "",
  connection: DEFAULT_CONNECTION_DETAILS,
};

export function normalizeSasToken(token: string): string {
  return token.trim().replace(/^\?/, "");
}

export function normalizeAccessToken(token: string): string {
  return token.trim().replace(/^Bearer\s+/i, "");
}

export function parseConnectionString(
  connectionString: string,
): ParsedConnectionString {
  const parts = connectionString
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  const values = new Map<string, string>();
  for (const part of parts) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const value = part.slice(separatorIndex + 1).trim();
    values.set(key, value);
  }

  const directAccountName = values.get("accountname") ?? null;
  const sharedAccessSignature = values.get("sharedaccesssignature") ?? null;
  const accountKey = values.get("accountkey") ?? null;
  const tableEndpoint = values.get("tableendpoint") ?? null;
  const blobEndpoint =
    values.get("blobendpoint") ?? values.get("fileendpoint") ?? null;
  const endpointAccountName =
    extractAccountNameFromEndpoint(tableEndpoint ?? undefined) ??
    extractAccountNameFromEndpoint(blobEndpoint ?? undefined);

  return {
    accountName: directAccountName ?? endpointAccountName,
    sharedAccessSignature,
    accountKey,
    tableEndpoint,
    blobEndpoint,
  };
}

export function mergeConnectionDetailsFromConnectionString(
  current: ConnectionDetails,
  connectionString: string,
): ConnectionDetails {
  const parsed = parseConnectionString(connectionString);

  return {
    ...current,
    profile: current.profile,
    storageAccountName: parsed.accountName ?? current.storageAccountName,
    tableEndpoint: parsed.tableEndpoint ?? current.tableEndpoint,
    blobEndpoint: parsed.blobEndpoint ?? current.blobEndpoint,
  };
}

export function validateConnectionDetails(
  connection: ConnectionDetails,
): ConnectionValidationResult {
  const normalizedProfile = normalizeAzureProfile(connection.profile);
  const normalized: ConnectionDetails = {
    profile: normalizedProfile,
    storageAccountName: connection.storageAccountName.trim(),
    tableEndpoint: connection.tableEndpoint.trim(),
    tableName:
      connection.tableName.trim() || buildAzureTableName(normalizedProfile),
    blobEndpoint: connection.blobEndpoint.trim(),
    blobContainerName: connection.blobContainerName.trim(),
  };

  if (!normalized.storageAccountName) {
    return { ok: false, error: "Storage account name is required." };
  }

  if (!isValidHttpUrl(normalized.tableEndpoint)) {
    return { ok: false, error: "Table endpoint must be a valid https URL." };
  }

  if (!normalized.tableName) {
    return { ok: false, error: "Table name is required." };
  }

  if (!/^[A-Za-z][A-Za-z0-9]{2,62}$/.test(normalized.tableName)) {
    return {
      ok: false,
      error:
        "Table name must be 3-63 characters, start with a letter, and use only letters or numbers.",
    };
  }

  if (!isValidHttpUrl(normalized.blobEndpoint)) {
    return {
      ok: false,
      error: "Blob endpoint must be a valid https URL.",
    };
  }

  if (!normalized.blobContainerName) {
    return { ok: false, error: "Blob container name is required." };
  }

  if (
    !/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(normalized.blobContainerName)
  ) {
    return {
      ok: false,
      error:
        "Blob container name must be 3-63 lowercase characters and may include hyphens.",
    };
  }

  return { ok: true, connection: normalized };
}

export function validateAuthForm(values: AuthFormValues): ValidationResult {
  if (values.mode === "sas-token") {
    const sasToken = normalizeSasToken(values.sasToken);
    if (!sasToken) {
      return { ok: false, error: "SAS token is required." };
    }

    const connectionResult = validateConnectionDetails(values.connection);
    if (!connectionResult.ok) {
      return connectionResult;
    }

    return {
      ok: true,
      authState: {
        mode: "sas-token",
        connection: connectionResult.connection,
        sasToken,
      },
    };
  }

  if (values.mode === "access-token") {
    const accessToken = normalizeAccessToken(values.accessToken);
    if (!accessToken) {
      return { ok: false, error: "Access token is required." };
    }

    const connectionResult = validateConnectionDetails(values.connection);
    if (!connectionResult.ok) {
      return connectionResult;
    }

    return {
      ok: true,
      authState: {
        mode: "access-token",
        connection: connectionResult.connection,
        accessToken,
      },
    };
  }

  const connectionString = values.connectionString.trim();
  if (!connectionString) {
    return { ok: false, error: "Connection string is required." };
  }

  const parsed = parseConnectionString(connectionString);

  const mergedConnection = {
    ...values.connection,
    storageAccountName:
      parsed.accountName ?? values.connection.storageAccountName,
    tableEndpoint: parsed.tableEndpoint ?? values.connection.tableEndpoint,
    blobEndpoint: parsed.blobEndpoint ?? values.connection.blobEndpoint,
  };

  const connectionResult = validateConnectionDetails(mergedConnection);
  if (!connectionResult.ok) {
    return connectionResult;
  }

  if (parsed.sharedAccessSignature) {
    return {
      ok: true,
      authState: {
        mode: "connection-string",
        connection: connectionResult.connection,
        connectionString,
        sharedAccessSignature: normalizeSasToken(parsed.sharedAccessSignature),
      },
    };
  }

  if (parsed.accountKey) {
    return {
      ok: false,
      error:
        "Account-key connection strings are not supported in this browser-only app. Use a SAS connection string or a Microsoft Entra access token.",
    };
  }

  return {
    ok: false,
    error:
      "Unsupported connection string. Use one that includes SharedAccessSignature, or use an access token.",
  };
}

export function resolveStorageAuth(
  authState: StoredAuthState,
): ResolvedStorageAuth {
  if (authState.mode === "access-token") {
    return {
      kind: "bearer",
      connection: authState.connection,
      accessToken: authState.accessToken,
    };
  }

  if (authState.mode === "connection-string") {
    return {
      kind: "sas",
      connection: authState.connection,
      sasToken: authState.sharedAccessSignature,
    };
  }

  return {
    kind: "sas",
    connection: authState.connection,
    sasToken: authState.sasToken,
  };
}

function extractAccountNameFromEndpoint(
  endpoint: string | undefined,
): string | null {
  if (!endpoint) {
    return null;
  }

  try {
    const url = new URL(endpoint);
    return url.hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
