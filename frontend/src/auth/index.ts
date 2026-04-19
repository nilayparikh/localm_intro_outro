export { AuthGate } from "./AuthGate";
export { AuthProvider, useAuth } from "./AuthContext";
export {
  hasSecrets,
  clearSecrets,
  getSecret,
  getStoredAuthState,
  setSecret,
  setStoredAuthState,
  requireSasToken,
} from "./secretStore";
export {
  DEFAULT_CONNECTION_DETAILS,
  DEFAULT_AUTH_FORM_VALUES,
  mergeConnectionDetailsFromConnectionString,
  validateConnectionDetails,
  normalizeAccessToken,
  normalizeSasToken,
  parseConnectionString,
  resolveStorageAuth,
  validateAuthForm,
  type ConnectionDetails,
  type AuthFormValues,
  type AuthMode,
  type StoredAuthState,
  type ResolvedStorageAuth,
} from "./credentials";
export type { AzureProfile } from "../azureProfiles";
