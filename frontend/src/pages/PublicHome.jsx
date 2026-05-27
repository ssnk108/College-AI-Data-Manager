import { ArrowRight, BookOpen, Building2, CheckCircle2, FileText, GraduationCap, MapPin, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collegeApi } from "../api/client.js";
import { Badge } from "../components/ui.jsx";
import { compactCollegeTableData } from "../utils/compactTableData.js";

const courseBuckets = ["B.Tech", "MBA", "BCA", "MCA", "Diploma", "BBA", "M.Tech", "Pharmacy"];
const trustItems = [
  ["Verified Colleges", ShieldCheck],
  ["Updated Data", CheckCircle2],
  ["Student Friendly", GraduationCap],
  ["Printable Reports", FileText]
];

export default function PublicHome() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [colleges, setColleges] = useState([]);
  const [databaseOffline, setDatabaseOffline] = useState(false);

  useEffect(() => {
    collegeApi
      .list({ sortBy: "updatedAt" })
      .then((items) => {
        setColleges(items.slice(0, 8));
        setDatabaseOffline(false);
      })
      .catch(() => setDatabaseOffline(true));
  }, []);

  const states = useMemo(() => [...new Set(colleges.map((college) => college.basicInfo?.state).filter(Boolean))].slice(0, 6), [colleges]);
  const featured = colleges.slice(0, 3);

  function submitSearch(event) {
    event.preventDefault();
    navigate(search.trim() ? `/colleges?search=${encodeURIComponent(search.trim())}` : "/colleges");
  }

  return (
    <div>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:px-6 lg:py-24">
          <div className="fade-up">
            <Badge tone="sky">Trusted college discovery</Badge>
            <h1 className="mt-6 max-w-4xl text-[2.75rem] font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[56px]">
              Find colleges with <span className="text-blue-600">trusted</span> approvals and placement insights.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Compare student-friendly college profiles with clean course summaries, approvals, placements, facilities, and printable reports.</p>
            <form onSubmit={submitSearch} className="fade-up-delay-1 mt-9 flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/60 transition focus-within:border-blue-600 sm:flex-row">
              <div className="flex flex-1 items-center gap-4 px-4">
                <Search className="text-slate-400" size={22} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent py-4 text-base font-semibold outline-none placeholder:text-slate-400" placeholder="Search by college, city, state, course, approval..." />
              </div>
              <button className="rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-700">Search</button>

            </form>
            <div className="fade-up-delay-2 mt-6 flex flex-wrap gap-3">
              {trustItems.map(([label, Icon]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  <Icon className="text-blue-600" size={17} /> {label}
                </span>
              ))}
            </div>
          </div>
          <div className="fade-up-delay-2 grid gap-4 self-center rounded-3xl border border-slate-200 bg-slate-50 p-4">
            {featured.length ? featured.map((college) => <FeaturedCard key={college._id} college={college} />) : <EmptyHeroCard databaseOffline={databaseOffline} />}
            <div className="mt-4 text-center">
              <Link
                to="/colleges"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-base font-bold text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.05)] ring-1 ring-slate-200 transition hover:-translate-y-[1px] hover:ring-blue-600 hover:text-blue-600"
              >
                <span className="inline-flex rounded-md bg-blue-50 p-1 text-blue-600 ring-1 ring-blue-100">
                  <Building2 size={16} />
                </span>
                View All Colleges
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Stat icon={Building2} label="College profiles" value={colleges.length ? `${colleges.length}+` : "Growing"} />
          <Stat icon={ShieldCheck} label="Verified signals" value="Approvals" />
          <Stat icon={BookOpen} label="Course catalog" value="Structured" />
          <Stat icon={Sparkles} label="Student reports" value="Printable" />
        </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-4 lg:grid-cols-2 lg:px-6">
        <BrowsePanel title="Browse by state" items={states.length ? states : ["West Bengal", "Jharkhand", "Uttar Pradesh", "Maharashtra", "Madhya Pradesh"]} href={(item) => `/states/${encodeURIComponent(item)}`} />
        <BrowsePanel title="Browse by course" items={courseBuckets} href={(item) => `/colleges?course=${encodeURIComponent(item)}`} />
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Featured colleges</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Recently updated public profiles</h2>
            </div>
            <Link to="/colleges" className="inline-flex items-center gap-2 text-base font-bold text-blue-700 hover:text-blue-800">View all colleges <ArrowRight size={18} /></Link>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {(featured.length ? featured : colleges.slice(0, 3)).map((college) => <CollegeTile key={college._id} college={college} />)}
            {!colleges.length && <p className="text-base text-slate-500">{databaseOffline ? "Database is offline right now. Public profiles will appear once MongoDB reconnects." : "Connect MongoDB and add colleges to show featured public profiles."}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedCard({ college }) {
  const compact = compactCollegeTableData(college);
  return (
    <Link to={`/colleges/${college._id}`} className="hover-lift rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950">{compact.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-base text-slate-500"><MapPin size={17} /> {compact.city || "City"}{compact.state ? `, ${compact.state}` : ""}</p>
        </div>
        <Star className="text-amber-500" size={20} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {compact.courses.visible.map((course) => <span key={course} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">{course}</span>)}
      </div>
    </Link>
  );
}

function CollegeTile({ college }) {
  const compact = compactCollegeTableData(college);
  return (
    <Link to={`/colleges/${college._id}`} className="hover-lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <GraduationCap className="text-blue-600" size={28} />
      <h3 className="mt-5 text-lg font-bold text-slate-950">{compact.name}</h3>
      <p className="mt-2 text-base text-slate-500">{compact.city || "City not added"}{compact.state ? `, ${compact.state}` : ""}</p>
      <p className="mt-4 text-base font-bold text-slate-700">{compact.courses.visible.join(", ") || "Courses updating"}</p>
    </Link>
  );
}

function BrowsePanel({ title, items, href }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {items.map((item) => <Link key={item} to={href(item)} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">{item}</Link>)}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="hover-lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Icon className="text-blue-600" size={28} />
      <p className="mt-5 text-base font-semibold text-slate-500">{label}</p>
      <p className="text-3xl font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function EmptyHeroCard({ databaseOffline }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-base leading-7 text-slate-500 shadow-sm">
      {databaseOffline ? "Database is offline right now. You can still use the portal layout while MongoDB reconnects." : "Featured colleges will appear here once the database is connected."}
    </div>
  );
}
