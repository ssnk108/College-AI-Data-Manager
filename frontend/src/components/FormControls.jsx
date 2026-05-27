import React from "react";

export function TextInput({ label, value, onChange, required, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}{required ? " *" : ""}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, rows = 3 }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
      />
    </label>
  );
}

export function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
