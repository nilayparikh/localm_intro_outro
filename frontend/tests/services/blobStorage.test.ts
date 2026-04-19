import test from "node:test";
import assert from "node:assert/strict";
import type { StoredAuthState } from "../../src/auth";
import {
  ensureBlobContainerExists,
  uploadBlob,
} from "../../src/services/blobStorage";

const AUTH_STATE: StoredAuthState = {
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
};

test("ensureBlobContainerExists creates the configured container and ignores conflicts", async () => {
  const calls: Array<{ url: string; method: string }> = [];
  const fetchMock: typeof fetch = async (input, init) => {
    calls.push({
      url: typeof input === "string" ? input : input.toString(),
      method: init?.method ?? "GET",
    });

    return new Response("", { status: 201 });
  };

  await ensureBlobContainerExists(AUTH_STATE, fetchMock);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.method, "PUT");
  assert.match(calls[0]?.url ?? "", /\/banner\?restype=container&sv=/);
});

test("uploadBlob provisions the container before uploading the blob payload", async () => {
  const calls: Array<{ url: string; method: string }> = [];
  const fetchMock: typeof fetch = async (input, init) => {
    calls.push({
      url: typeof input === "string" ? input : input.toString(),
      method: init?.method ?? "GET",
    });

    return new Response("", { status: calls.length === 1 ? 201 : 201 });
  };

  await uploadBlob(
    "logos/logo.png",
    new File(["logo"], "logo.png", { type: "image/png" }),
    AUTH_STATE,
    fetchMock,
  );

  assert.equal(calls.length, 2);
  assert.match(calls[0]?.url ?? "", /\/banner\?restype=container&sv=/);
  assert.match(calls[1]?.url ?? "", /\/banner\/logos\/logo\.png\?sv=/);
  assert.equal(calls[1]?.method, "PUT");
});
