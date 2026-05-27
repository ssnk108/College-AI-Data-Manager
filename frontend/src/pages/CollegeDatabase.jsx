import { Award, BriefcaseBusiness, Building2, ChevronDown, ChevronRight, Download, Edit, Eye, FileText, MapPin, RotateCcw, Search, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { collegeApi } from "../api/client.js";
import { useAdminAuth } from "../auth/AdminAuthContext.jsx";
import { VerificationBadge } from "../components/Badges.jsx";
import { Button, Modal, PageHeader, Skeleton } from "../components/ui.jsx";
import { ownershipOptions } from "../data/emptyCollege.js";
import { collegeToRow, exportXlsx } from "../utils.js";
import { compactCollegeTableData } from "../utils/compactTableData.js";

export default function CollegeDatabase({ variant = "public" }) {
  const { isAdmin } = useAdminAuth();
  const effectiveAdmin = variant === "admin" && isAdmin;
  const location = useLocation();
  const { state: routeState } = useParams();
  const [searchParams] = useSearchParams();
  const [colleges, setColleges] = useState([]);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    state: routeState ? decodeURIComponent(routeState) : "",
    city: "",
    course: searchParams.get("course") || "",
    ownership: "",
    approval: "",
    verificationStatus: "",
    sortBy: "updatedAt"
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportDone, setExportDone] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      collegeApi
        .list(filters)
        .then((items) => {
          setColleges(items);
          setLoadError("");
        })
        .catch((error) => {
          setColleges([]);
          const message = error.response?.data?.message || "Unable to load colleges";
          setLoadError(message);
          if (effectiveAdmin) toast.error(message);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [filters, effectiveAdmin]);

  const filteredColleges = useMemo(() => {
    const searchText = String(filters.search || "").trim().toLowerCase();
    if (!searchText) return colleges;

    return colleges.filter((college) => {
      const basic = college.basicInfo || {};
      const text = [
        basic.collegeName,
        basic.shortName,
        basic.city,
        basic.state,
        basic.collegeType,
        college.normalizedCollegeName,
        college.affiliationApproval?.affiliatedUniversity,
        ...(college.aliases || []),
        ...(college.courses || []).map((course) => course.courseName)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(searchText);
    });
  }, [colleges, filters.search]);

  const rows = useMemo(
    () => filteredColleges.map((college) => ({ college, row: collegeToRow(college), compact: compactCollegeTableData(college) })),
    [filteredColleges]
  );
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => key !== "sortBy" && Boolean(value));

  function resetFilters() {
    setFilters({ search: "", state: "", city: "", course: "", ownership: "", approval: "", verificationStatus: "", sortBy: "updatedAt" });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if (!effectiveAdmin) {
      toast.error("Admin login required");
      return;
    }
    await collegeApi.remove(deleteTarget._id);
    setColleges((items) => items.filter((item) => item._id !== deleteTarget._id));
    setDeleteTarget(null);
    toast.success("College deleted");
  }

  if (!effectiveAdmin) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-6">
        <div className="fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Aspire College search</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-5xl">Explore colleges</h2>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">Browse simplified student-facing college cards. Full course, fee, approval, placement, and source details open inside the college profile.</p>
            </div>
            {hasActiveFilters && <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"><RotateCcw size={16} /> Reset filters</button>}
          </div>
        </div>

        <div className="fade-up-delay-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Filter icon={Search} placeholder="Search college, city, course..." value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })} />
            <Filter icon={MapPin} placeholder="State" value={filters.state} onChange={(v) => setFilters({ ...filters, state: v })} />
            <Filter icon={MapPin} placeholder="City" value={filters.city} onChange={(v) => setFilters({ ...filters, city: v })} />
            <Filter icon={Building2} placeholder="Course" value={filters.course} onChange={(v) => setFilters({ ...filters, course: v })} />
            <Select value={filters.ownership} onChange={(v) => setFilters({ ...filters, ownership: v })} options={ownershipOptions} first="Ownership" />
            <Filter icon={Award} placeholder="Approval" value={filters.approval} onChange={(v) => setFilters({ ...filters, approval: v })} />
            <Select value={filters.verificationStatus} onChange={(v) => setFilters({ ...filters, verificationStatus: v })} options={["Verified", "Partially Verified", "Low Confidence", "Needs Verification"]} first="Verification" />
            <Select value={filters.sortBy} onChange={(v) => setFilters({ ...filters, sortBy: v })} options={["updatedAt", "fees", "placement", "ranking"]} first="Sort by" />
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(filters).filter(([key, value]) => key !== "sortBy" && Boolean(value)).map(([key, value]) => (
                <span key={key} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">{labelize(key)}: {value}</span>
              ))}
            </div>
          )}
        </div>

        {loadError && <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-base font-semibold text-amber-900 shadow-lg shadow-amber-100">College database is temporarily offline. Please try again after MongoDB reconnects.</div>}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <PublicCardSkeleton key={index} />)}</div>
        ) : rows.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ college, compact }, index) => <PublicCollegeCard key={college._id} college={college} compact={compact} index={index} />)}
          </div>
        ) : (
          <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Database"
        title={effectiveAdmin ? "Admin college database" : "Explore colleges"}
        description={effectiveAdmin ? "Advanced management table with CRUD controls, exports, source counts, and confidence signals." : "Search public college profiles with clean summaries for students and families."}
        actions={effectiveAdmin && <Button icon={Download} variant="secondary" onClick={async () => { await exportXlsx(colleges); setExportDone(true); toast.success("Export generated"); }}>Export CSV/XLSX</Button>}
      />

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <Filter placeholder="Search colleges..." value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })} />
        <Filter placeholder="State" value={filters.state} onChange={(v) => setFilters({ ...filters, state: v })} />
        <Filter placeholder="City" value={filters.city} onChange={(v) => setFilters({ ...filters, city: v })} />
        <Filter placeholder="Course" value={filters.course} onChange={(v) => setFilters({ ...filters, course: v })} />
        <Select value={filters.ownership} onChange={(v) => setFilters({ ...filters, ownership: v })} options={ownershipOptions} first="Ownership" />
        <Filter placeholder="Approval" value={filters.approval} onChange={(v) => setFilters({ ...filters, approval: v })} />
        <Select value={filters.verificationStatus} onChange={(v) => setFilters({ ...filters, verificationStatus: v })} options={["Verified", "Partially Verified", "Low Confidence", "Needs Verification"]} first="Verification" />
        <Select value={filters.sortBy} onChange={(v) => setFilters({ ...filters, sortBy: v })} options={["updatedAt", "fees", "placement", "ranking"]} first="Sort by" />
      </div>

      <div className="overflow-auto rounded-lg border bg-white shadow-sm">
        {loadError && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {effectiveAdmin ? loadError : "College database is temporarily offline. Please try again after MongoDB reconnects."}
          </div>
        )}
        <table className="w-full min-w-[1280px] table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-600 shadow-sm">
            <tr>
              <th className="w-9 px-2 py-3"></th>
              {[
                ["College name", "w-56"],
                ["City", "w-28"],
                ["State", "w-32"],
                ["Ownership", "w-28"],
                ["Affiliated university", "w-48"],
                ["Main courses", "w-56"],
                ["Fees range", "w-28"],
                ["Approvals", "w-40"],
                ["NAAC/NIRF", "w-36"],
                ["Placement", "w-32"],
                ["Verification", "w-36"],
                ["Updated", "w-24"],
                ["Actions", "w-40"]
              ].map(([head, width]) => <th key={head} className={`${width} px-3 py-3`}>{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ college, compact }, index) => (
              <React.Fragment key={college._id}>
                <tr className={`border-t align-top transition hover:bg-blue-50/40 ${index % 2 ? "bg-slate-50/40" : "bg-white"}`}>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      title={expandedRows[college._id] ? "Collapse row" : "Expand row"}
                      onClick={() => setExpandedRows((current) => ({ ...current, [college._id]: !current[college._id] }))}
                      className="rounded p-1 text-slate-500 hover:bg-slate-200"
                    >
                      {expandedRows[college._id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      to={effectiveAdmin ? `/admin/colleges/${college._id}` : `/colleges/${college._id}`}
                      state={{ from: `${location.pathname}${location.search}` }}
                      className="font-semibold text-slate-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title={compact.name}
                    >
                      {compact.name || "View details"}
                    </Link>
                  </td>
                  <CompactText value={compact.city} />
                  <CompactText value={compact.state} />
                  <CompactText value={compact.ownership} />
                  <CompactText value={compact.affiliatedUniversity} />
                  <td className="px-3 py-2">
                    <ChipList items={compact.courses.visible} hiddenCount={compact.courses.hiddenCount} empty="-" title={compact.courses.categories.join(", ")} />
                  </td>
                  <CompactText value={compact.feesRange || "-"} />
                  <td className="px-3 py-2">
                    <ChipList items={compact.approvals.visible} hiddenCount={compact.approvals.hiddenCount} empty="-" title={compact.approvals.approvals.join(", ")} tone="emerald" />
                  </td>
                  <td className="px-3 py-2">
                    <ChipList items={compact.naacNirf} empty="-" tone="amber" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">{compact.placement.length ? compact.placement.map((item) => <span key={item} title={item} className="block truncate text-xs font-semibold text-slate-700">{item}</span>) : <MutedDash />}</div>
                  </td>
                  <td className="px-3 py-2"><VerificationBadge status={compact.verificationStatus} /></td>
                  <CompactText value={compact.lastUpdated} />
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <IconLink to={effectiveAdmin ? `/admin/colleges/${college._id}` : `/colleges/${college._id}`} icon={Eye} label="View" state={{ from: `${location.pathname}${location.search}` }} />
                      {effectiveAdmin && <IconLink to={`/admin/colleges/${college._id}/edit`} icon={Edit} label="Edit" state={{ from: `${location.pathname}${location.search}` }} />}
                      {effectiveAdmin && <IconLink to={`/admin/colleges/${college._id}`} icon={FileText} label="Report" state={{ from: `${location.pathname}${location.search}` }} />}
                      {effectiveAdmin && <button onClick={() => setDeleteTarget(college)} title="Delete" className="rounded-lg bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
                {expandedRows[college._id] && (
                  <tr className="border-t bg-slate-50">
                    <td></td>
                    <td colSpan="13" className="px-3 py-3">
                      <ExpandedSummary college={college} compact={compact} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {loading && <TableSkeleton />}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="14" className="px-3 py-8 text-center text-slate-500">
                  {filters.search ? (
                    <span>
                      No colleges found for <strong className="text-slate-900">"{filters.search}"</strong>. Try a different keyword or clear the search.
                    </span>
                  ) : (
                    "No colleges found. Try adjusting your filters or search terms."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal
        open={Boolean(deleteTarget)}
        title="Delete college?"
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        footer={<><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete} icon={Trash2}>Delete</Button></>}
      >
        <p className="text-sm leading-6 text-slate-600">Are you sure you want to delete <b>{deleteTarget?.basicInfo?.collegeName}</b>? This cannot be undone.</p>
      </Modal>
      <Modal
        open={exportDone}
        title="File generated successfully"
        tone="success"
        onClose={() => setExportDone(false)}
        footer={<Button variant="success" onClick={() => setExportDone(false)}>Done</Button>}
      >
        <p className="text-sm text-slate-600">Your database export has been generated by the browser.</p>
      </Modal>
    </div>
  );
}

function PublicCollegeCard({ college, compact, index }) {
  const approvals = compact.approvals.visible.slice(0, 3);
  const placement = compact.placement[0];
  return (
    <Link
      to={`/colleges/${college._id}`}
      state={{ from: "/colleges" }}
      className="fade-up group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold leading-tight text-slate-950 group-hover:text-blue-700">{compact.name}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-base font-medium text-slate-500"><MapPin size={17} /> {compact.city || "City not added"}{compact.state ? `, ${compact.state}` : ""}</p>
        </div>
        <span className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">View</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {compact.courses.visible.length ? compact.courses.visible.slice(0, 4).map((course) => <Chip key={course}>{course}</Chip>) : <MutedText>Courses updating</MutedText>}
        {compact.courses.hiddenCount > 0 && <Chip dark>+{compact.courses.hiddenCount} more</Chip>}
      </div>
      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 text-base">
        <InfoLine icon={Building2} label="Ownership" value={compact.ownership || "Not added"} />
        <div className="flex items-start gap-3">
          <Award className="mt-1 shrink-0 text-emerald-600" size={18} />
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Approvals</p>
            <div className="mt-1 flex flex-wrap gap-1.5">{approvals.length ? approvals.map((item) => <Chip key={item} tone="emerald">{item}</Chip>) : <MutedText>Not added</MutedText>}</div>
          </div>
        </div>
        {placement && <InfoLine icon={BriefcaseBusiness} label="Placement highlight" value={placement} />}
      </div>
    </Link>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 shrink-0 text-blue-600" size={18} />
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function Chip({ children, tone = "sky", dark = false }) {
  const toneClass = dark ? "bg-slate-900 text-white" : tone === "emerald" ? "bg-green-50 text-green-700 ring-green-100" : "bg-blue-50 text-blue-700 ring-blue-100";
  return <span className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${toneClass}`}>{children}</span>;
}

function MutedText({ children }) {
  return <span className="text-base font-semibold text-slate-400">{children}</span>;
}

function PublicCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="mt-3 h-5 w-1/2" />
      <div className="mt-5 flex gap-2"><Skeleton className="h-8 w-20 rounded-full" /><Skeleton className="h-8 w-20 rounded-full" /><Skeleton className="h-8 w-20 rounded-full" /></div>
      <Skeleton className="mt-6 h-20" />
    </div>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      <Search className="mx-auto text-blue-600" size={42} />
      <h3 className="mt-5 text-2xl font-extrabold text-slate-950">No colleges found</h3>
      <p className="mx-auto mt-2 max-w-xl text-base leading-7 text-slate-500">{hasFilters ? "Try clearing one or two filters, or search by city, state, course, approval, or ownership." : "Once colleges are added, they will appear here as clean student-friendly cards."}</p>
      {hasFilters && <button onClick={onReset} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">Clear filters</button>}
    </div>
  );
}

function Filter({ value = "", onChange, icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
      <input
        {...props}
        type="text"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className={`${Icon ? "pl-11" : ""} field`}
      />
    </div>
  );
}

function Select({ value, onChange, options, first }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="field"><option value="">{first}</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
}

function labelize(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function IconLink({ to, icon: Icon, label, state }) {
  return <Link to={to} state={state} title={label} className="rounded-lg bg-slate-100 p-2 text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"><Icon size={16} /></Link>;
}

function CompactText({ value, className = "" }) {
  return (
    <td className="px-3 py-2">
      <div title={value || ""} className={`max-h-10 overflow-hidden text-ellipsis break-words leading-5 ${className}`}>
        {value || <MutedDash />}
      </div>
    </td>
  );
}

function ChipList({ items = [], hiddenCount = 0, empty = "-", title = "", tone = "slate" }) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100"
  }[tone];
  if (!items.length) return <MutedDash text={empty} />;
  return (
    <div title={title || items.join(", ")} className="flex max-h-12 flex-wrap gap-1 overflow-hidden">
      {items.map((item) => <span key={item} className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${toneClass}`}>{item}</span>)}
      {hiddenCount > 0 && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">+{hiddenCount} more</span>}
    </div>
  );
}

function MutedDash({ text = "-" }) {
  return <span className="text-slate-400">{text}</span>;
}

function ExpandedSummary({ college, compact }) {
  const courses = (college.courses || []).map((course) => course.courseName).filter(Boolean);
  const facilities = compact.facilities;
  return (
    <div className="grid gap-3 text-sm md:grid-cols-3">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Courses</p>
        <p className="line-clamp-3 text-slate-700" title={courses.join(", ")}>{courses.slice(0, 12).join(", ")}{courses.length > 12 ? ` +${courses.length - 12} more` : ""}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Facilities</p>
        <ChipList items={facilities.visible} hiddenCount={facilities.hiddenCount} title={facilities.all.join(", ")} />
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Sources</p>
        <p className="text-slate-700">{(college.sourceLinks || []).length} source links stored</p>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="border-t">
      <td colSpan="14" className="px-3 py-3">
        <div className="grid grid-cols-6 gap-3">
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
        </div>
      </td>
    </tr>
  ));
}
