import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { checkingSession, isAdmin } = useAdminAuth();

  if (checkingSession) {
    return <div className="rounded-2xl bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">Checking admin session...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ adminRequired: true, from: location.pathname }} />;
  }

  return children;
}
