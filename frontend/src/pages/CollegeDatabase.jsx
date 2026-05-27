import { Download, Edit, Eye, FileText, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { collegeApi } from "../api/client.js";
import { VerificationBadge } from "../components/Badges.jsx";
import { ownershipOptions } from "../data/emptyCollege.js";
import { collegeToRow, exportXlsx } from "../utils.js";

export default function CollegeDatabase() {
  const [colleges, setColleges] = useState([]);
  const [filters, setFilters] = useState({ search: "", state: "", city: "", course: "", ownership: "", approval: "", verificationStatus: "", sortBy: "updatedAt" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      collegeApi
        .list(filters)
        .then(setColleges)
        .catch(() => toast.error("Unable to load colleges"))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [filters]);

  const rows = useMemo(() => colleges.map((college) => ({ college, row: collegeToRow(college) })), [colleges]);

  async function handleDelete(id) {
    if (!confirm("Delete this college?")) return;
    await collegeApi.remove(id);
    setColleges((items) => items.filter((item) => item._id !== id));
    toast.success("College deleted");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">College Database</h2>
          <p className="text-sm text-slate-600">Excel-like view with filters, sorting, actions, and export.</p>
        </div>
        <button onClick={() => exportXlsx(colleges)} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          <Download size={16} /> Export CSV/XLSX
        </button>
      </div>

      <div className="grid gap-3 rounded-lg bg-white p-4 shadow-sm md:grid-cols-4">
        <Filter placeholder="Search" value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })} />
        <Filter placeholder="State" value={filters.state} onChange={(v) => setFilters({ ...filters, state: v })} />
        <Filter placeholder="City" value={filters.city} onChange={(v) => setFilters({ ...filters, city: v })} />
        <Filter placeholder="Course" value={filters.course} onChange={(v) => setFilters({ ...filters, course: v })} />
        <Select value={filters.ownership} onChange={(v) => setFilters({ ...filters, ownership: v })} options={ownershipOptions} first="Ownership" />
        <Filter placeholder="Approval" value={filters.approval} onChange={(v) => setFilters({ ...filters, approval: v })} />
        <Select value={filters.verificationStatus} onChange={(v) => setFilters({ ...filters, verificationStatus: v })} options={["Verified", "Partially Verified", "Low Confidence", "Needs Verification"]} first="Verification" />
        <Select value={filters.sortBy} onChange={(v) => setFilters({ ...filters, sortBy: v })} options={["updatedAt", "fees", "placement", "ranking"]} first="Sort by" />
      </div>

      <div className="overflow-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-[1200px] w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>{["College name", "City", "State", "Ownership", "Affiliated university", "Main courses", "Fees range", "Approval status", "NAAC/NIRF", "Average package", "Verification status", "Last updated", "Actions"].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(({ college, row }) => (
              <tr key={college._id} className="border-t align-top">
                {Object.entries(row).map(([key, value]) => (
                  <td key={key} className="px-3 py-3">{key === "Verification status" ? <VerificationBadge status={value} /> : value}</td>
                ))}
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <IconLink to={`/colleges/${college._id}`} icon={Eye} label="View" />
                    <IconLink to={`/colleges/${college._id}/edit`} icon={Edit} label="Edit" />
                    <IconLink to={`/colleges/${college._id}`} icon={FileText} label="Report" />
                    <button onClick={() => handleDelete(college._id)} title="Delete" className="rounded-md bg-rose-50 p-2 text-rose-700"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan="13" className="px-3 py-8 text-center text-slate-500">No colleges found.</td></tr>}
          </tbody>
        </table>
      </div>
      {loading && <p className="text-sm text-slate-600">Loading...</p>}
    </div>
  );
}

function Filter(props) {
  return <input {...props} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ocean" />;
}

function Select({ value, onChange, options, first }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">{first}</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
}

function IconLink({ to, icon: Icon, label }) {
  return <Link to={to} title={label} className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Icon size={16} /></Link>;
}
