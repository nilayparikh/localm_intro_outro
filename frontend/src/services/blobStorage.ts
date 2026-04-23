import { resolveStorageAuth, type StoredAuthState } from "../auth";

const STORAGE_API_VERSION = "2024-11-04";

function normalizeBlobPath(path: string): string {
  return path
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getBlobContainerBaseUrl(authState: StoredAuthState): string {
  const auth = resolveStorageAuth(authState);
  return `${auth.connection.blobEndpoint.replace(/\/+$/, "")}/${auth.connection.blobContainerName}`;
}

function getBlobContainerCreateUrl(authState: StoredAuthState): string {
  const auth = resolveStorageAuth(authState);
  const baseUrl = getBlobContainerBaseUrl(authState);

  if (auth.kind === "sas") {
    return `${baseUrl}?restype=container&${auth.sasToken}`;
  }

  return `${baseUrl}?restype=container`;
}

export function extractBlobPath(
  reference: string,
  authState: StoredAuthState,
): string | null {
  const trimmed = reference.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return null;
  }

  if (!/^[a-z]+:\/\//i.test(trimmed)) {
    return trimmed.replace(/^\/+/, "");
  }

  try {
    const url = new URL(trimmed);
    const containerPrefix = `/${authState.connection.blobContainerName}/`;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.startsWith(containerPrefix)) {
      return pathname.slice(containerPrefix.length);
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

async function buildAuthHeaders(
  authState: StoredAuthState,
): Promise<Record<string, string>> {
  const auth = resolveStorageAuth(authState);
  if (auth.kind === "sas") {
    return {};
  }

  return {
    Authorization: `Bearer ${auth.accessToken}`,
    "x-ms-date": new Date().toUTCString(),
  };
}

export function buildBlobUrl(path: string, authState: StoredAuthState): string {
  const auth = resolveStorageAuth(authState);
  const normalizedPath = normalizeBlobPath(path);
  const baseUrl = `${getBlobContainerBaseUrl(authState)}/${normalizedPath}`;
  if (auth.kind === "sas") {
    return `${baseUrl}?${auth.sasToken}`;
  }

  return baseUrl;
}

export function getBlobUrl(path: string, authState: StoredAuthState): string {
  const auth = resolveStorageAuth(authState);
  const normalizedPath = normalizeBlobPath(path);
  if (auth.kind === "sas") {
    return buildBlobUrl(path, authState);
  }

  return `${getBlobContainerBaseUrl(authState)}/${normalizedPath}`;
}

export async function ensureBlobContainerExists(
  authState: StoredAuthState,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const authHeaders = await buildAuthHeaders(authState);
  const response = await fetchImpl(getBlobContainerCreateUrl(authState), {
    method: "PUT",
    headers: {
      ...authHeaders,
      "x-ms-version": STORAGE_API_VERSION,
      "Content-Length": "0",
    },
  });

  if (!response.ok && response.status !== 409) {
    throw new Error(
      `Failed to create blob container: ${response.status} ${await response.text()}`,
    );
  }
}

export async function resolveBlobAssetUrl(
  reference: string,
  authState: StoredAuthState,
): Promise<string> {
  if (reference.startsWith("data:") || reference.startsWith("blob:")) {
    return reference;
  }

  const path = extractBlobPath(reference, authState);
  if (!path) {
    return reference;
  }

  const auth = resolveStorageAuth(authState);
  if (auth.kind === "sas") {
    return buildBlobUrl(path, authState);
  }

  const downloadedAsset = await downloadBlobAsset(reference, authState);
  if (!downloadedAsset) {
    return reference;
  }

  return URL.createObjectURL(downloadedAsset.blob);
}

export async function downloadBlobAsset(
  reference: string,
  authState: StoredAuthState,
  fetchImpl: typeof fetch = fetch,
): Promise<{ path: string; blob: Blob } | null> {
  if (reference.startsWith("data:") || reference.startsWith("blob:")) {
    return null;
  }

  const path = extractBlobPath(reference, authState);
  if (!path) {
    return null;
  }

  const authHeaders = await buildAuthHeaders(authState);
  const response = await fetchImpl(getBlobUrl(path, authState), {
    method: "GET",
    headers: {
      ...authHeaders,
      "x-ms-version": STORAGE_API_VERSION,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download blob asset: ${response.status} ${await response.text()}`,
    );
  }

  return {
    path,
    blob: await response.blob(),
  };
}

export async function uploadBlob(
  path: string,
  file: File,
  authState: StoredAuthState,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const storedPath = path.replace(/^\/+/, "");
  await ensureBlobContainerExists(authState, fetchImpl);

  const url = buildBlobUrl(storedPath, authState);
  const authHeaders = await buildAuthHeaders(authState);

  const createResponse = await fetchImpl(url, {
    method: "PUT",
    headers: {
      ...authHeaders,
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type || "application/octet-stream",
      "x-ms-version": STORAGE_API_VERSION,
    },
    body: file,
  });

  if (!createResponse.ok) {
    throw new Error(
      `Failed to upload blob: ${createResponse.status} ${await createResponse.text()}`,
    );
  }

  return url.split("?")[0] ?? url;
}

export async function deleteBlob(
  path: string,
  authState: StoredAuthState,
): Promise<void> {
  const url = buildBlobUrl(path.replace(/^\/+/, ""), authState);
  const authHeaders = await buildAuthHeaders(authState);
  const response = await fetch(url, {
    method: "DELETE",
    headers: { ...authHeaders, "x-ms-version": STORAGE_API_VERSION },
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete blob: ${response.status}`);
  }
}
