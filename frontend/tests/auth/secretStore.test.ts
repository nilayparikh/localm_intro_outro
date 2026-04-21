import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  clearSecrets,
  getStoredAuthState,
  hasSecrets,
  setStoredAuthState,
} from "../../src/auth/secretStore";

interface MemoryStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

function createMemoryStorage(): MemoryStorageLike {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => {
      values.clear();
    },
  };
}

const originalLocalStorage = globalThis.localStorage;
const originalSessionStorage = globalThis.sessionStorage;

afterEach(() => {
  if (originalLocalStorage) {
    globalThis.localStorage = originalLocalStorage;
  } else {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  }

  if (originalSessionStorage) {
    globalThis.sessionStorage = originalSessionStorage;
  } else {
    delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
  }
});

test("stored auth persists in local storage for future browser sessions", () => {
  const localStorage = createMemoryStorage();
  const sessionStorage = createMemoryStorage();
  globalThis.localStorage = localStorage as unknown as Storage;
  globalThis.sessionStorage = sessionStorage as unknown as Storage;

  setStoredAuthState({
    mode: "sas-token",
    sasToken: "sv=2025-01-05&sig=test",
    connection: {
      profile: "Dev",
      storageAccountName: "satutslocalm",
      tableEndpoint: "https://satutslocalm.table.core.windows.net",
      tableName: "BannersDev",
      blobEndpoint: "https://satutslocalm.blob.core.windows.net",
      blobContainerName: "banner",
    },
  });

  assert.notEqual(localStorage.getItem("localm_intro_outro_auth_state"), null);
  assert.equal(sessionStorage.getItem("localm_intro_outro_auth_state"), null);
  assert.equal(hasSecrets(), true);
  assert.equal(getStoredAuthState()?.connection.tableName, "BannersDev");
});

test("clearSecrets removes persisted auth from local and session storage", () => {
  const localStorage = createMemoryStorage();
  const sessionStorage = createMemoryStorage();
  globalThis.localStorage = localStorage as unknown as Storage;
  globalThis.sessionStorage = sessionStorage as unknown as Storage;

  localStorage.setItem(
    "localm_intro_outro_auth_state",
    JSON.stringify({ mode: "sas-token" }),
  );
  localStorage.setItem(
    "localm_intro_outro_sas_token",
    "sv=2025-01-05&sig=test",
  );
  sessionStorage.setItem(
    "localm_intro_outro_auth_state",
    JSON.stringify({ mode: "sas-token" }),
  );
  sessionStorage.setItem(
    "localm_intro_outro_sas_token",
    "sv=2025-01-05&sig=test",
  );

  clearSecrets();

  assert.equal(localStorage.getItem("localm_intro_outro_auth_state"), null);
  assert.equal(localStorage.getItem("localm_intro_outro_sas_token"), null);
  assert.equal(sessionStorage.getItem("localm_intro_outro_auth_state"), null);
  assert.equal(sessionStorage.getItem("localm_intro_outro_sas_token"), null);
});
