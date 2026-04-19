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
  login: (authState: StoredAuthState) => void;
  logoff: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasSecrets);
  const [authState, setAuthState] = useState<StoredAuthState | null>(
    getStoredAuthState(),
  );

  const login = useCallback((nextAuthState: StoredAuthState) => {
    setStoredAuthState(nextAuthState);
    setAuthState(nextAuthState);
    setIsAuthenticated(true);
  }, []);

  const logoff = useCallback(() => {
    clearSecrets();
    setAuthState(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authState, login, logoff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
