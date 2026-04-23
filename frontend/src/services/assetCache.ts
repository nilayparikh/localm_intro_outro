const ASSET_CACHE_NAME = "localm-renderable-assets-v1";
const ASSET_CACHE_ORIGIN = "https://localm-assets.invalid";

type CacheLike = Pick<Cache, "match" | "put" | "delete">;
type CacheStorageLike = Pick<CacheStorage, "open">;

function getCacheStorage(
  cacheStorage: CacheStorageLike | undefined = globalThis.caches,
): CacheStorageLike | null {
  return cacheStorage ?? null;
}

export function buildAssetCacheUrl(blobPath: string): string {
  const normalizedPath = blobPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${ASSET_CACHE_ORIGIN}/${normalizedPath}`;
}

async function openAssetCache(
  cacheStorage?: CacheStorageLike,
): Promise<CacheLike | null> {
  const availableCacheStorage = getCacheStorage(cacheStorage);
  if (!availableCacheStorage) {
    return null;
  }

  return availableCacheStorage.open(ASSET_CACHE_NAME);
}

function createAssetCacheRequest(blobPath: string): Request {
  return new Request(buildAssetCacheUrl(blobPath), { method: "GET" });
}

export async function getCachedAssetBlob(
  blobPath: string,
  cacheStorage?: CacheStorageLike,
): Promise<Blob | null> {
  const cache = await openAssetCache(cacheStorage);
  if (!cache) {
    return null;
  }

  const response = await cache.match(createAssetCacheRequest(blobPath));
  if (!response) {
    return null;
  }

  return response.blob();
}

export async function setCachedAssetBlob(
  blobPath: string,
  blob: Blob,
  cacheStorage?: CacheStorageLike,
): Promise<void> {
  const cache = await openAssetCache(cacheStorage);
  if (!cache) {
    return;
  }

  await cache.put(
    createAssetCacheRequest(blobPath),
    new Response(blob, {
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
      },
    }),
  );
}

export async function deleteCachedAssetBlob(
  blobPath: string,
  cacheStorage?: CacheStorageLike,
): Promise<void> {
  const cache = await openAssetCache(cacheStorage);
  if (!cache) {
    return;
  }

  await cache.delete(createAssetCacheRequest(blobPath));
}
