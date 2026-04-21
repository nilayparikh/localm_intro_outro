import SHA256 from "crypto-js/sha256";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

export function createDatabaseHashFunction() {
  return async (input: string) => SHA256(input).toString();
}

export function getDatabaseOptions(isDev: boolean) {
  return {
    name: "localm_intro_outro",
    storage: getRxStorageDexie(),
    multiInstance: false,
    closeDuplicates: isDev,
    hashFunction: createDatabaseHashFunction(),
  };
}
