import { Construction, Sparkles } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { Badge, Card, PageHeader } from "../components/ui.jsx";

const copy = {
  research: ["Deep Research", "Run universal multi-pass research, source gap retries, PDF extraction, and quality scoring."],
  debug: ["Extraction Debug", "Review source URLs, scrape failures, planner decisions, token usage, and extraction quality signals."],
  reports: ["Reports", "Export research quality reports, XLSX snapshots, public PDFs, and consultancy summaries."],
  settings: ["Settings", "Manage admin profile, source priorities, research thresholds, and app configuration."],
  consultancy: ["Consultancy Data", "Manage private incentives, donation notes, counsellor remarks, priority colleges, and internal strategy."],
  "merge-queue": ["Merge Queue", "Review duplicate matches, compare AI drafts, and apply smart merges without overwriting private data."]
};

export default function AdminPlaceholder({ type }) {
  const [title, description] = copy[type] || ["Admin Tool", "Internal management workspace."];
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin module"
        title={title}
        description={description}
        actions={<Badge tone="indigo">Admin only</Badge>}
      />
      <Card className="text-center">
        <Construction className="mx-auto text-indigo-600" size={40} />
        <h2 className="mt-4 text-xl font-black">Module shell is ready</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">This route is separated inside the admin panel so it can grow into a dedicated internal workflow without touching the public student portal.</p>
        <Link to="/admin/ai-fill" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
          <Sparkles size={17} /> Start AI Research
        </Link>
      </Card>
    </div>
  );
}
