import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [admin, setAdmin] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setAdmin(null);
      return;
    }
    authApi.me()
      .then((result) => setAdmin(result.user))
      .catch(() => {
        localStorage.removeItem("adminToken");
        setToken("");
        setAdmin(null);
      });
  }, [token]);

  useEffect(() => {
    function onKey(event) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") setLoginOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function login(credentials) {
    const result = await authApi.login(credentials);
    localStorage.setItem("adminToken", result.token);
    setToken(result.token);
    setAdmin({ email: result.email, role: result.role, name: result.name });
    setLoginOpen(false);
    toast.success("Admin login successful");
  }

  function logout() {
    localStorage.removeItem("adminToken");
    setToken("");
    setAdmin(null);
    toast.success("Logged out");
  }

  const value = useMemo(() => ({
    token,
    admin,
    isAdmin: Boolean(token),
    loginOpen,
    setLoginOpen,
    login,
    logout
  }), [token, admin, loginOpen]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
