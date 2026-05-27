import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api, authApi } from "../api/client.js";

const TOKEN_KEY = "adminToken";
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [admin, setAdmin] = useState(null);
  const [checkingSession, setCheckingSession] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem(TOKEN_KEY);
      setAdmin(null);
      setCheckingSession(false);
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setCheckingSession(true);
    authApi
      .me()
      .then((result) => setAdmin(result.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common.Authorization;
        setToken("");
      })
      .finally(() => setCheckingSession(false));
  }, [token]);

  async function login(credentials) {
    const result = await authApi.login(credentials);
    setToken(result.token);
    setAdmin({ name: result.name, email: result.email, role: result.role });
    toast.success("Admin access unlocked");
    return result;
  }

  function logout() {
    setToken("");
    toast.success("Logged out");
  }

  const value = useMemo(
    () => ({
      admin,
      checkingSession,
      isAdmin: Boolean(token && admin),
      login,
      logout,
      token
    }),
    [admin, checkingSession, token]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
