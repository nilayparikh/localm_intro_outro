import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CONNECTION_DETAILS,
  normalizeSasToken,
  parseConnectionString,
  validateConnectionDetails,
  validateAuthForm,
} from "../../src/auth/credentials";

test("normalizeSasToken strips the leading question mark", () => {
  assert.equal(
    normalizeSasToken("?sv=2025-01-05&sig=abc"),
    "sv=2025-01-05&sig=abc",
  );
  assert.equal(
    normalizeSasToken("sv=2025-01-05&sig=abc"),
    "sv=2025-01-05&sig=abc",
  );
});

test("parseConnectionString extracts account name and shared access signature", () => {
  const parsed = parseConnectionString(
    "TableEndpoint=https://satutslocalm.table.core.windows.net/;BlobEndpoint=https://satutslocalm.blob.core.windows.net/;SharedAccessSignature=?sv=2025-01-05&sig=abc",
  );

  assert.equal(parsed.accountName, "satutslocalm");
  assert.equal(
    parsed.tableEndpoint,
    "https://satutslocalm.table.core.windows.net/",
  );
  assert.equal(
    parsed.blobEndpoint,
    "https://satutslocalm.blob.core.windows.net/",
  );
  assert.equal(parsed.sharedAccessSignature, "?sv=2025-01-05&sig=abc");
  assert.equal(parsed.accountKey, null);
});

test("validateConnectionDetails requires explicit table endpoint", () => {
  const result = validateConnectionDetails({
    ...DEFAULT_CONNECTION_DETAILS,
    tableEndpoint: "",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /table endpoint/i);
  }
});

test("validateAuthForm rejects account-key connection strings in the browser", () => {
  const result = validateAuthForm({
    mode: "connection-string",
    sasToken: "",
    accessToken: "",
    connection: DEFAULT_CONNECTION_DETAILS,
    connectionString:
      "DefaultEndpointsProtocol=https;AccountName=satutslocalm;AccountKey=secret;EndpointSuffix=core.windows.net",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /browser-only app/i);
  }
});

test("validateAuthForm stores explicit connection info for access token mode", () => {
  const result = validateAuthForm({
    mode: "access-token",
    sasToken: "",
    accessToken: "Bearer token-123",
    connectionString: "",
    connection: {
      ...DEFAULT_CONNECTION_DETAILS,
      profile: "Dev",
      tableName: "BannersDev",
      blobContainerName: "banner",
    },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.authState.mode, "access-token");
    assert.equal(result.authState.connection.tableName, "BannersDev");
    assert.equal(result.authState.connection.blobContainerName, "banner");
  }
});
