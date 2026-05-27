import React from "react";
import { Card } from "./ui.jsx";

export function TextInput({ label, value, onChange, required, type = "text", placeholder, helper, error }) {
  return (
    <label className="block">
      <span className="label">{label}{required ? " *" : ""}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field"
      />
      {helper && <span className="mt-1 block text-xs text-slate-500">{helper}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export function TextArea({ label, value, onChange, rows = 3, helper }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="field"
      />
      {helper && <span className="mt-1 block text-xs text-slate-500">{helper}</span>}
    </label>
  );
}

export function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="field">
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
    <Card>
      <h2 className="mb-4 text-lg font-bold text-slate-950">{title}</h2>
      {children}
    </Card>
  );
}
