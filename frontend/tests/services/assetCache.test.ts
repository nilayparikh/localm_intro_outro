import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssetCacheUrl,
  deleteCachedAssetBlob,
  getCachedAssetBlob,
  setCachedAssetBlob,
} from "../../src/services/assetCache";

class MemoryCache {
  private readonly responses = new Map<string, Response>();

  async match(request: Request): Promise<Response | undefined> {
    return this.responses.get(request.url);
  }

  async put(request: Request, response: Response): Promise<void> {
    this.responses.set(request.url, response.clone());
  }

  async delete(request: Request): Promise<boolean> {
    return this.responses.delete(request.url);
  }
}

class MemoryCacheStorage {
  private readonly caches = new Map<string, MemoryCache>();

  async open(name: string): Promise<Cache> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MemoryCache());
    }

    return this.caches.get(name)! as unknown as Cache;
  }
}

test("buildAssetCacheUrl encodes each blob path segment", () => {
  assert.equal(
    buildAssetCacheUrl("assets/audio/intro sting.mp3"),
    "https://localm-assets.invalid/assets/audio/intro%20sting.mp3",
  );
});

test("cached asset blobs round-trip through the local browser cache", async () => {
  const cacheStorage = new MemoryCacheStorage();
  const sourceBlob = new Blob(["hello"], { type: "audio/mpeg" });

  await setCachedAssetBlob(
    "assets/audio/intro.mp3",
    sourceBlob,
    cacheStorage as unknown as CacheStorage,
  );

  const cachedBlob = await getCachedAssetBlob(
    "assets/audio/intro.mp3",
    cacheStorage as unknown as CacheStorage,
  );

  assert.ok(cachedBlob);
  assert.equal(await cachedBlob.text(), "hello");
  assert.equal(cachedBlob.type, "audio/mpeg");

  await deleteCachedAssetBlob(
    "assets/audio/intro.mp3",
    cacheStorage as unknown as CacheStorage,
  );

  const deletedBlob = await getCachedAssetBlob(
    "assets/audio/intro.mp3",
    cacheStorage as unknown as CacheStorage,
  );

  assert.equal(deletedBlob, null);
});
