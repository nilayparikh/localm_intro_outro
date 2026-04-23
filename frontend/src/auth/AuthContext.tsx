import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  hasSecrets,
  clearSecrets,
  getStoredAuthState,
  setStoredAuthState,
} from "./secretStore";
import type { StoredAuthState } from "./credentials";

interface AuthContextValue {
  isAuthenticated: boolean;
  authState: StoredAuthState | null;
  authErrorMessage: string;
  login: (authState: StoredAuthState) => void;
  logoff: () => void;
  invalidateAuth: (message?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialAuthState = getStoredAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(initialAuthState && hasSecrets()),
  );
  const [authState, setAuthState] = useState<StoredAuthState | null>(
    initialAuthState,
  );
  const [authErrorMessage, setAuthErrorMessage] = useState("");

  const clearAuthSession = useCallback((message = "") => {
    clearSecrets();
    setAuthState(null);
    setIsAuthenticated(false);
    setAuthErrorMessage(message);
  }, []);

  const login = useCallback((nextAuthState: StoredAuthState) => {
    setStoredAuthState(nextAuthState);
    setAuthState(nextAuthState);
    setIsAuthenticated(true);
    setAuthErrorMessage("");
  }, []);

  const logoff = useCallback(() => {
    clearAuthSession();
  }, [clearAuthSession]);

  const invalidateAuth = useCallback(
    (message = "") => {
      clearAuthSession(message);
    },
    [clearAuthSession],
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authState,
        authErrorMessage,
        login,
        logoff,
        invalidateAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
