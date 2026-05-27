import React from "react";
import { Badge } from "./ui.jsx";

export function VerificationBadge({ status }) {
  const tones = {
    Verified: "emerald",
    "Partially Verified": "amber",
    "Low Confidence": "rose",
    "Needs Verification": "rose"
  };
  return <Badge tone={tones[status] || "rose"}>{status || "Needs Verification"}</Badge>;
}

export function ConfidenceBadge({ score = 0 }) {
  const tone = score >= 80 ? "emerald" : score >= 50 ? "amber" : "rose";
  return <Badge tone={tone}>Confidence {score}%</Badge>;
}
