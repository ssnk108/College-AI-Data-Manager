import { Activity, AlertTriangle, BarChart3, CheckCircle2, Clock, Database, FilePlus2, MapPinned, Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { collegeApi } from "../api/client.js";
import { Badge, Card, PageHeader, Skeleton } from "../components/ui.jsx";
import { compactCollegeTableData } from "../utils/compactTableData.js";

export default function AdminDashboard() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collegeApi
      .list({ sortBy: "updatedAt" })
      .then(setColleges)
      .catch(() => toast.error("Unable to load admin dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => buildMetrics(colleges), [colleges]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Internal Dashboard"
        title="AI consultancy management panel"
        description="Track database quality, extraction status, research gaps, and recently updated college profiles from one compact workspace."
        actions={<><Link to="/admin/ai-fill" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Sparkles size={17} /> Start AI Research</Link><Link to="/admin/manual" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><FilePlus2 size={17} /> Manual Add</Link></>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Database} label="Total colleges" value={metrics.total} />
        <MetricCard icon={CheckCircle2} label="Verified colleges" value={metrics.verified} tone="emerald" />
        <MetricCard icon={AlertTriangle} label="Low confidence" value={metrics.lowConfidence} tone="amber" />
        <MetricCard icon={Activity} label="Extraction success" value={`${metrics.successRate}%`} tone="indigo" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">Colleges by state</h3>
              <p className="text-sm text-slate-500">A quick operational view of regional coverage.</p>
            </div>
            <Badge tone="indigo">Analytics</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? <Skeleton className="h-40" /> : metrics.topStates.map((item) => <StateBar key={item.state} {...item} max={metrics.topStates[0]?.count || 1} />)}
            {!loading && metrics.topStates.length === 0 && <p className="text-sm text-slate-500">No state data yet.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">Review queue</h3>
              <p className="text-sm text-slate-500">Records that may need manual verification.</p>
            </div>
            <Badge tone="amber">{metrics.pendingReviews} pending</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            <QueueItem icon={Clock} label="Added today" value={metrics.addedToday} />
            <QueueItem icon={MapPinned} label="Missing location" value={metrics.missingLocation} />
            <QueueItem icon={BarChart3} label="Missing courses" value={metrics.missingCourses} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Recently updated colleges</h3>
            <p className="text-sm text-slate-500">Jump directly into records that changed most recently.</p>
          </div>
          <Link to="/admin/database" className="text-sm font-black text-indigo-700">Open database</Link>
        </div>
        <div className="mt-5 overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-2">College</th><th>State</th><th>Courses</th><th>Confidence</th><th>Sources</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="py-3"><Skeleton className="h-8" /></td></tr>}
              {!loading && colleges.slice(0, 8).map((college) => {
                const compact = compactCollegeTableData(college);
                return (
                  <tr key={college._id} className="border-t border-slate-100">
                    <td className="py-3 font-bold">{compact.name}</td>
                    <td>{compact.state || "-"}</td>
                    <td>{compact.courses.visible.join(", ") || "-"}</td>
                    <td>{college.confidenceScore || 0}%</td>
                    <td>{(college.sourceLinks || []).length}</td>
                    <td><Link className="font-bold text-indigo-700" to={`/admin/colleges/${college._id}`}>Manage</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function buildMetrics(colleges) {
  const today = new Date().toDateString();
  const byState = new Map();
  colleges.forEach((college) => {
    const state = college.basicInfo?.state || "Unknown";
    byState.set(state, (byState.get(state) || 0) + 1);
  });
  const verified = colleges.filter((college) => /verified/i.test(college.verificationStatus || "") && !/partial|low|need/i.test(college.verificationStatus || "")).length;
  const lowConfidence = colleges.filter((college) => Number(college.confidenceScore || 0) < 50 || /low|need/i.test(college.verificationStatus || "")).length;
  const withSources = colleges.filter((college) => (college.sourceLinks || []).length > 0).length;
  return {
    total: colleges.length,
    verified,
    lowConfidence,
    successRate: colleges.length ? Math.round((withSources / colleges.length) * 100) : 0,
    pendingReviews: lowConfidence,
    addedToday: colleges.filter((college) => new Date(college.createdAt || college.updatedAt || Date.now()).toDateString() === today).length,
    missingLocation: colleges.filter((college) => !college.basicInfo?.city || !college.basicInfo?.state).length,
    missingCourses: colleges.filter((college) => !(college.courses || []).length).length,
    topStates: [...byState.entries()].map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count).slice(0, 6)
  };
}

function MetricCard({ icon: Icon, label, value, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700"
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-950">{value}</p>
      </div>
    </Card>
  );
}

function StateBar({ state, count, max }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-bold"><span>{state}</span><span>{count}</span></div>
      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${Math.max(8, (count / max) * 100)}%` }} /></div>
    </div>
  );
}

function QueueItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <Icon className="text-slate-500" size={19} />
        <span className="font-bold text-slate-700">{label}</span>
      </div>
      <span className="text-lg font-black">{value}</span>
    </div>
  );
}
