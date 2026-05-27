import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import React, { useEffect, useState } from "react";
import { healthApi } from "../api/client.js";

export default function DatabaseStatusBanner() {
  const [status, setStatus] = useState({ checking: true, connected: true, message: "", database: "connected" });

  async function checkHealth() {
    setStatus((current) => ({ ...current, checking: true }));
    try {
      const result = await healthApi.get();
      setStatus({
        checking: false,
        connected: result.databaseConnected,
        message: result.databaseConnected ? "" : "Database temporarily unavailable",
        database: result.database || "unknown",
        nextRetryAt: result.nextRetryAt
      });
    } catch (error) {
      const data = error.response?.data;
      setStatus({
        checking: false,
        connected: false,
        message: data?.message || "Backend or database is temporarily unavailable",
        database: data?.database || "unknown",
        nextRetryAt: data?.nextRetryAt
      });
    }
  }

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    function onDatabaseStatus(event) {
      setStatus((current) => ({
        ...current,
        checking: false,
        connected: event.detail?.connected !== false,
        message: event.detail?.message || "",
        database: event.detail?.database || current.database,
        nextRetryAt: event.detail?.nextRetryAt || null
      }));
    }
    window.addEventListener("database-status", onDatabaseStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("database-status", onDatabaseStatus);
    };
  }, []);

  if (status.connected) return null;

  return (
    <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {status.database === "unknown" ? <WifiOff className="mt-0.5 shrink-0 text-amber-700" size={18} /> : <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={18} />}
          <div>
            <p className="font-bold">Database connection is unavailable</p>
            <p className="text-amber-800">{status.message || "MongoDB is reconnecting in the background."}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={checkHealth}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
        >
          <RefreshCw className={status.checking ? "animate-spin" : ""} size={15} />
          Retry
        </button>
      </div>
    </div>
  );
}
