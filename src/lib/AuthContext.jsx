import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const AuthContext = createContext(null);
const ADMIN_BACKUP_KEY = "madetrace_admin_backup_token";
const RO_KEY = "madetrace_impersonation_ro";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReadOnlyImpersonation, setIsReadOnlyImpersonation] = useState(sessionStorage.getItem(RO_KEY) === "1");

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await api.me();
      setUser(me);
      return me;
    } catch {
      setToken("");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (body) => {
    const data = await api.register(body);
    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_BACKUP_KEY);
    sessionStorage.removeItem(RO_KEY);
    setIsReadOnlyImpersonation(false);
    setToken("");
    setUser(null);
  }, []);

  /** Admin "log in as company": keeps the admin's own token so stopImpersonating() can restore it. */
  const impersonateAs = useCallback(
    async (accessToken, readOnly) => {
      if (!sessionStorage.getItem(ADMIN_BACKUP_KEY)) {
        sessionStorage.setItem(ADMIN_BACKUP_KEY, getToken());
      }
      sessionStorage.setItem(RO_KEY, readOnly ? "1" : "0");
      setIsReadOnlyImpersonation(readOnly);
      setToken(accessToken);
      await refresh();
    },
    [refresh]
  );

  const canStopImpersonating = !!sessionStorage.getItem(ADMIN_BACKUP_KEY);

  const stopImpersonating = useCallback(async () => {
    const backup = sessionStorage.getItem(ADMIN_BACKUP_KEY);
    if (!backup) return;
    sessionStorage.removeItem(ADMIN_BACKUP_KEY);
    sessionStorage.removeItem(RO_KEY);
    setIsReadOnlyImpersonation(false);
    setToken(backup);
    await refresh();
  }, [refresh]);

  const value = {
    user, loading, isImpersonated: !!user?.isImpersonated, isReadOnlyImpersonation, canStopImpersonating,
    login, register, logout, refresh, setUser, impersonateAs, stopImpersonating,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
