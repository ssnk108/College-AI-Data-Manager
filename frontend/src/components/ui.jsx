import { Loader2, X } from "lucide-react";
import React from "react";

const buttonStyles = {
  primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-100",
  success: "bg-green-600 text-white shadow-sm hover:bg-green-700 focus:ring-green-100",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-100",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-950 focus:ring-slate-100",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:ring-slate-100"
};

export function Button({ children, variant = "primary", className = "", loading = false, icon: Icon, ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]} ${className}`}
    >
      {loading ? <Loader2 className="animate-spin" size={17} /> : Icon ? <Icon size={17} /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, variant = "ghost", className = "", ...props }) {
  return (
    <button
      {...props}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm transition duration-200 focus:outline-none focus:ring-4 ${buttonStyles[variant]} ${className}`}
    >
      <Icon size={17} />
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p>}
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">{title}</h2>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, title, children, footer, onClose, tone = "slate" }) {
  if (!open) return null;
  const toneClass = tone === "danger" ? "bg-red-600" : tone === "success" ? "bg-green-600" : "bg-blue-600";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="fade-up max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className={`h-1 ${toneClass}`} />
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
          {onClose && <IconButton type="button" icon={X} label="Close" onClick={onClose} />}
        </div>
        <div className="max-h-[62vh] overflow-auto p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, tone = "slate", className = "" }) {
  const styles = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    indigo: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-green-50 text-green-700 ring-green-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    rose: "bg-red-50 text-red-700 ring-red-100",
    sky: "bg-blue-50 text-blue-700 ring-blue-100"
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${styles[tone]} ${className}`}>{children}</span>;
}

export function LoadingSpinner({ label = "Loading..." }) {
  return <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Loader2 className="animate-spin text-blue-600" size={18} /> {label}</div>;
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="no-print overflow-x-auto">
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm md:min-w-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition ${active === tab ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
