import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_REAUTH_MESSAGE,
  isAuthenticationFailure,
  validateStoredAuthSession,
} from "../../src/auth/sessionValidation";

const storedAuthState = {
  mode: "sas-token" as const,
  sasToken: "sv=2025-01-05&sig=test",
  connection: {
    profile: "Dev" as const,
    storageAccountName: "satutslocalm",
    tableEndpoint: "https://satutslocalm.table.core.windows.net/",
    tableName: "BannersDev",
    blobEndpoint: "https://satutslocalm.blob.core.windows.net/",
    blobContainerName: "banner",
  },
};

test("isAuthenticationFailure recognizes Azure authentication errors", () => {
  assert.equal(
    isAuthenticationFailure({
      statusCode: 403,
      code: "AuthenticationFailed",
      message:
        "Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.",
    }),
    true,
  );
});

test("validateStoredAuthSession asks for reauthentication when Azure rejects stored credentials", async () => {
  const result = await validateStoredAuthSession(storedAuthState, async () => {
    throw {
      statusCode: 403,
      code: "AuthenticationFailed",
      message: "Server failed to authenticate the request.",
    };
  });

  assert.deepEqual(result, {
    ok: false,
    message: AUTH_REAUTH_MESSAGE,
  });
});

test("validateStoredAuthSession ignores non-auth startup errors", async () => {
  await assert.rejects(
    () =>
      validateStoredAuthSession(storedAuthState, async () => {
        throw new Error("Network unavailable");
      }),
    /Network unavailable/,
  );
});
