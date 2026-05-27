import React from "react";
import { Database, FilePlus2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">College CRM with AI-assisted data entry</p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight">College AI Data Manager</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Store verified college profiles, draft structured data from official source links, and export reports for counselling workflows.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <HomeButton to="/add-manual" icon={FilePlus2} title="Add College Manually" text="Use the complete structured form." />
        <HomeButton to="/add-ai" icon={Sparkles} title="Add College with AI" text="Scrape supplied URLs and review the draft before saving." />
        <HomeButton to="/colleges" icon={Database} title="View College Database" text="Search, filter, edit, delete, and export." />
      </div>
    </div>
  );
}

function HomeButton({ to, icon: Icon, title, text }) {
  return (
    <Link to={to} className="rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Icon className="text-ocean" size={28} />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </Link>
  );
}
