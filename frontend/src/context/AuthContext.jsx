import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_EXPIRED_EVENT, loginAdmin, TOKEN_STORAGE_KEY } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));

  useEffect(() => {
    const handleExpiredSession = () => setToken(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await loginAdmin(credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setToken(result.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
  }, []);

  const value = useMemo(() => ({ token, login, logout }), [token, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }
  return context;
}
