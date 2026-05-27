import React from "react";

export function VerificationBadge({ status }) {
  const styles = {
    Verified: "bg-emerald-100 text-emerald-800",
    "Partially Verified": "bg-amber-100 text-amber-800",
    "Low Confidence": "bg-rose-100 text-rose-800",
    "Needs Verification": "bg-rose-100 text-rose-800"
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || styles["Needs Verification"]}`}>{status || "Needs Verification"}</span>;
}

export function ConfidenceBadge({ score = 0 }) {
  return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Confidence {score}%</span>;
}
