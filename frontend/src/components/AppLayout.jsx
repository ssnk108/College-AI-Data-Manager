import React from "react";
import { Database, Home, Plus, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/add-manual", label: "Manual", icon: Plus },
  { to: "/add-ai", label: "AI Fill", icon: Sparkles },
  { to: "/colleges", label: "Database", icon: Database }
];

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="no-print border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean">Education consultancy tool</p>
            <h1 className="text-xl font-bold">College AI Data Manager</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-ocean text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
