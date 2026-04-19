import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

export function getDatabaseOptions(isDev: boolean) {
  return {
    name: "localm_banners",
    storage: getRxStorageDexie(),
    multiInstance: false,
    closeDuplicates: isDev,
  };
}
