import React from "react";
import { BarChart3, GraduationCap, Lock, Menu, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext.jsx";
import DatabaseStatusBanner from "../components/DatabaseStatusBanner.jsx";
import { Button, IconButton, Modal } from "../components/ui.jsx";

const publicLinks = [
  { to: "/", label: "Home", match: (path) => path === "/" },
  { to: "/colleges", label: "Colleges", match: (path) => path === "/colleges" || path.startsWith("/colleges/") },
  { to: "/search", label: "Search", match: (path) => path === "/search" },
  { to: "/states/West%20Bengal", label: "States", match: (path) => path.startsWith("/states/") },
  { to: "/#about", label: "About", match: () => false },
  { to: "/#contact", label: "Contact", match: () => false }
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const { isAdmin } = useAdminAuth();
  const location = useLocation();

  React.useEffect(() => {
    function onKey(event) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setLoginOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <Link to="/" onDoubleClick={() => setLoginOpen(true)} className="flex items-center gap-3 rounded-xl outline-none transition hover:opacity-90 focus:ring-4 focus:ring-blue-100">
            <LogoMark />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Aspire College</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">College Discovery</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {publicLinks.map((link) => <PublicLink key={`${link.to}-${link.label}`} active={link.match(location.pathname)} {...link} />)}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/colleges" className="group hidden items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex">
              <Search className="transition group-hover:scale-110" size={18} /> Find colleges
            </Link>
            {isAdmin ? (
              <Link to="/admin/dashboard" className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950" title="Open admin panel">
                <Lock size={15} />
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950" title="Admin login">
                <Lock size={15} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <IconButton icon={mobileOpen ? X : Menu} label="Menu" onClick={() => setMobileOpen((value) => !value)} className="lg:hidden" />
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <div className="grid gap-1">
              {publicLinks.map((link) => <MobileLink key={`${link.to}-${link.label}`} active={link.match(location.pathname)} {...link} onClick={() => setMobileOpen(false)} />)}
            </div>
          </div>
        )}
      </header>
      <DatabaseStatusBanner />
      <main>
        <Outlet />
      </main>
      <footer id="contact" className="mt-16 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 lg:px-6">
          <div>
            <div className="flex items-center gap-3 text-xl font-extrabold"><LogoMark small /> Aspire College</div>
            <p className="mt-4 text-base leading-7 text-slate-500">A clean college discovery portal for students, backed by verified consultancy data.</p>
          </div>
          <FooterBlock title="Explore" items={["Engineering", "Management", "Computer Applications", "Pharmacy"]} />
          <FooterBlock title="Popular States" items={["West Bengal", "Jharkhand", "Uttar Pradesh", "Maharashtra"]} />
        </div>
      </footer>
      <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}

function LogoMark({ small = false }) {
  const [broken, setBroken] = React.useState(false);
  const size = small ? "h-9 w-9" : "h-12 w-12";
  return (
    <div className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm transition duration-200 hover:scale-[1.02]`}>
      {!broken ? <img src="/logo.png" alt="Aspire College logo" className="h-full w-full object-cover" onError={() => setBroken(true)} /> : <GraduationCap size={small ? 20 : 25} />}
    </div>
  );
}

function AdminLoginModal({ open, onClose }) {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      onClose();
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="Admin access" onClose={onClose}>
      <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
        <p className="text-base leading-7 text-slate-600">Secure internal access for consultancy management, AI research, and private data.</p>
        <label className="block">
          <span className="label">Email</span>
          <input type="email" className="field" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input type="password" className="field" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        </label>
        <Button type="submit" loading={loading} icon={Lock} className="w-full">Login to Admin Panel</Button>
        <p className="text-center text-xs text-slate-400">Shortcut: Ctrl + Shift + A</p>
      </form>
    </Modal>
  );
}

function PublicLink({ to, label, active }) {
  return (
    <Link to={to} className={`relative rounded-lg px-3.5 py-2 text-[15px] font-semibold transition duration-200 ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
      {label}
    </Link>
  );
}

function MobileLink({ to, label, onClick, active }) {
  return <Link to={to} onClick={onClick} className={`rounded-xl px-3 py-3 text-base font-bold transition ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>{label}</Link>;
}

function FooterBlock({ title, items }) {
  return (
    <div>
      <p className="text-base font-extrabold text-slate-900">{title}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">{item}</span>)}
      </div>
    </div>
  );
}
