import React from "react";
import { Activity, BarChart3, Bell, Bot, Brain, Database, FileBarChart, FilePlus2, GitMerge, LayoutDashboard, LogOut, Menu, Search, Settings, Shield, Sparkles, X } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext.jsx";
import DatabaseStatusBanner from "../components/DatabaseStatusBanner.jsx";
import { IconButton } from "../components/ui.jsx";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/ai-fill", label: "AI Fill", icon: Sparkles },
  { to: "/admin/research", label: "Deep Research", icon: Brain },
  { to: "/admin/database", label: "Database", icon: Database },
  { to: "/admin/manual", label: "Manual Add", icon: FilePlus2 },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/consultancy", label: "Consultancy Data", icon: Shield },
  { to: "/admin/merge-queue", label: "Merge Queue", icon: GitMerge },
  { to: "/admin/debug", label: "Extraction Debug", icon: Activity },
  { to: "/admin/settings", label: "Settings", icon: Settings }
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-800 bg-slate-950 text-white lg:block">
        <AdminSidebar onLogout={handleLogout} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <aside className="relative h-full w-80 max-w-[85vw] bg-slate-950 text-white shadow-2xl">
            <AdminSidebar onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <IconButton icon={mobileOpen ? X : Menu} label="Menu" onClick={() => setMobileOpen((value) => !value)} className="lg:hidden" />
              <div className="hidden min-w-[320px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
                <Search size={17} className="text-slate-400" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder="Search college, source, city..." />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/manual" className="hidden rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 sm:inline-flex">Quick Add</Link>
              <button className="relative rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200" title="Notifications">
                <Bell size={18} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
              </button>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">{(admin?.name || "A").slice(0, 1)}</div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-bold leading-4">{admin?.name || "Admin"}</p>
                  <p className="text-xs text-slate-500">Internal panel</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <DatabaseStatusBanner />
        <main className="min-h-[calc(100vh-4rem)] px-4 py-5 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminSidebar({ onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 p-5">
        <Link to="/admin/dashboard" onClick={onNavigate} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-950/40">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-300">Admin Panel</p>
            <h2 className="text-base font-black">Aspire College OS</h2>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-auto p-3">
        {adminLinks.map((link) => <SidebarLink key={link.to} {...link} onClick={onNavigate} />)}
      </nav>
      <div className="p-3">
        <div className="mb-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
          <Bot className="text-indigo-300" size={22} />
          <p className="mt-3 text-sm font-bold">AI Research Engine</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">Deep extraction, merge protection, source quality, and private data controls.</p>
        </div>
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-rose-200 hover:bg-rose-500/10">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}

function SidebarLink({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${
        isActive ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/30" : "text-slate-300 hover:bg-slate-900 hover:text-white"
      }`}
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}
