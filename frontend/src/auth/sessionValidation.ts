import { probeTableAccess } from "../sync/azureTableSync";
import type { StoredAuthState } from "./credentials";

export const AUTH_REAUTH_MESSAGE =
  "Stored Azure credentials expired or are invalid. Please log in again.";

const AUTH_FAILURE_CODES = new Set([
  "AuthenticationFailed",
  "ExpiredAuthenticationToken",
  "InvalidAuthenticationInfo",
  "AuthorizationFailure",
  "NoAuthenticationInformation",
]);

interface AuthValidationSuccess {
  ok: true;
}

interface AuthValidationFailure {
  ok: false;
  message: string;
}

export type AuthValidationResult =
  | AuthValidationSuccess
  | AuthValidationFailure;

type AuthProbe = (authState: StoredAuthState) => Promise<void>;

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function collectErrorStrings(error: unknown): string[] {
  if (!error || typeof error !== "object") {
    return [];
  }

  const candidate = error as Record<string, unknown>;
  const strings = new Set<string>();

  const pushValue = (value: unknown) => {
    const stringValue = readNonEmptyString(value);
    if (stringValue) {
      strings.add(stringValue);
    }
  };

  pushValue(candidate.code);
  pushValue(candidate.errorCode);
  pushValue(candidate.message);
  pushValue(candidate.bodyAsText);

  const odataError = candidate["odata.error"] as
    | Record<string, unknown>
    | undefined;
  if (odataError) {
    pushValue(odataError.code);
    if (odataError.message && typeof odataError.message === "object") {
      pushValue((odataError.message as Record<string, unknown>).value);
    }
  }

  const response = candidate.response as Record<string, unknown> | undefined;
  if (response) {
    pushValue(response.bodyAsText);
    const parsedBody = response.parsedBody as
      | Record<string, unknown>
      | undefined;
    if (parsedBody) {
      pushValue(parsedBody.code);
      pushValue(parsedBody.message);
      const parsedOdataError = parsedBody["odata.error"] as
        | Record<string, unknown>
        | undefined;
      if (parsedOdataError) {
        pushValue(parsedOdataError.code);
        if (
          parsedOdataError.message &&
          typeof parsedOdataError.message === "object"
        ) {
          pushValue(
            (parsedOdataError.message as Record<string, unknown>).value,
          );
        }
      }
    }
  }

  return [...strings];
}

function readStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as Record<string, unknown>;
  const statusCode = candidate.statusCode ?? candidate.status;

  if (typeof statusCode === "number") {
    return statusCode;
  }

  return null;
}

export function isAuthenticationFailure(error: unknown): boolean {
  const statusCode = readStatusCode(error);
  const joinedMessage = collectErrorStrings(error).join(" ");

  if ([...AUTH_FAILURE_CODES].some((code) => joinedMessage.includes(code))) {
    return true;
  }

  return (
    (statusCode === 401 || statusCode === 403) &&
    /auth|authorization|signature|token|expired/i.test(joinedMessage)
  );
}

export async function validateStoredAuthSession(
  authState: StoredAuthState,
  probeAccess: AuthProbe = probeTableAccess,
): Promise<AuthValidationResult> {
  try {
    await probeAccess(authState);
    return { ok: true };
  } catch (error) {
    if (isAuthenticationFailure(error)) {
      return {
        ok: false,
        message: AUTH_REAUTH_MESSAGE,
      };
    }

    throw error;
  }
}
