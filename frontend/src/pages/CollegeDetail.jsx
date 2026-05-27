import { Download, Edit, EyeOff, FileJson, Lock, Printer, RefreshCw, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { collegeApi, privateApi } from "../api/client.js";
import { useAdminAuth } from "../auth/AdminAuthContext.jsx";
import A4Report from "../components/A4Report.jsx";
import { ConfidenceBadge, VerificationBadge } from "../components/Badges.jsx";
import { Button, Card as UiCard, Modal, PageHeader, Tabs } from "../components/ui.jsx";
import { exportJson, exportXlsx } from "../utils.js";

export default function CollegeDetail({ variant = "public" }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, token } = useAdminAuth();
  const effectiveAdmin = variant === "admin" && isAdmin;
  const [college, setCollege] = useState(null);
  const [hidePrivate, setHidePrivate] = useState(new URLSearchParams(window.location.search).has("public"));
  const [privateData, setPrivateData] = useState(null);
  const [researching, setResearching] = useState(false);
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [privateWarning, setPrivateWarning] = useState(false);

  useEffect(() => {
    const request = effectiveAdmin ? collegeApi.getAdmin(id) : collegeApi.get(id);
    request
      .then(setCollege)
      .catch(() => toast.error("Unable to load college"));
  }, [id, effectiveAdmin]);

  useEffect(() => {
    function onKey(event) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "h") setHidePrivate((value) => !value);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleDelete() {
    if (!effectiveAdmin) return toast.error("Admin login required");
    await collegeApi.remove(id);
    toast.success("College deleted");
    navigate("/admin/database");
  }

  async function handleReResearch() {
    if (!effectiveAdmin) return toast.error("Admin login required");
    setResearching(true);
    try {
      const aiDraft = await collegeApi.aiExtract({
        collegeName: basic.collegeName,
        city: basic.city,
        state: basic.state,
        officialWebsite: basic.officialWebsite,
        extractionMode: "deep",
        directAdmissionAvailable: college.directAdmissionAvailable || "Not Sure",
        ownershipInput: college.ownershipInput || basic.ownershipType || "Not Sure",
        sourceUrls: (college.sourceLinks || []).map((source) => source.url).filter(Boolean)
      });
      const result = await collegeApi.merge(id, { college: aiDraft, updatedBy: "ai-reresearch" });
      setCollege(result.college);
      toast.success(`Re-research merged ${result.mergeSummary?.changedFields || 0} updates`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Re-research failed");
    } finally {
      setResearching(false);
    }
  }

  const backUrl = location.state?.from || (effectiveAdmin ? "/admin/database" : "/colleges");

  if (!college) return <p className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">Loading college...</p>;

  const basic = college.basicInfo || {};
  const tabs = ["Basic Info", "Approvals", "Courses", "Admission", "Placements", "Facilities", "Sources"];
  if (effectiveAdmin) tabs.push("Private");

  return (
    <div className={`${effectiveAdmin ? "space-y-6" : "mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-6"}`}>
      <PageHeader
        eyebrow="College Profile"
        title={basic.collegeName}
        description={`${basic.city || "City not added"}${basic.state ? `, ${basic.state}` : ""}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(backUrl)}>
              Back
            </Button>
            <VerificationBadge status={college.verificationStatus} />
            <ConfidenceBadge score={college.confidenceScore} />
          </>
        }
      />
      <div className="no-print flex flex-wrap gap-2">
        {effectiveAdmin && <Link to={`/admin/colleges/${id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"><Edit size={16} /> Edit</Link>}
        {effectiveAdmin && <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>Delete</Button>}
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Download A4 Report</Button>
        {effectiveAdmin && <Button variant="secondary" icon={FileJson} onClick={() => exportJson(college)}>Export JSON</Button>}
        {effectiveAdmin && <Button variant="secondary" icon={Download} onClick={() => exportXlsx([college])}>Export XLSX</Button>}
        {effectiveAdmin && <Button variant="success" loading={researching} icon={RefreshCw} onClick={handleReResearch}>{researching ? "Re-Researching..." : "Re-Research College"}</Button>}
        {effectiveAdmin && <Button variant="secondary" icon={EyeOff} onClick={() => setHidePrivate((value) => !value)}>Hide Consultancy Data</Button>}
        {effectiveAdmin && <Button variant="ghost" onClick={() => window.open(`/colleges/${id}?public=1`, "_blank")}>Open Public View</Button>}
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={(tab) => {
        if (tab === "Private" && !privateData) setPrivateWarning(true);
        setActiveTab(tab);
      }} />
      <DetailSections college={college} activeTab={activeTab} />
      {effectiveAdmin && !hidePrivate && (
        activeTab === "Private" &&
        <PrivateConsultancyPanel
          collegeId={id}
          token={token}
          privateData={privateData}
          setPrivateData={setPrivateData}
        />
      )}
      <A4Report college={college} />
      <Modal open={deleteOpen} title="Delete college?" tone="danger" onClose={() => setDeleteOpen(false)} footer={<><Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" icon={Trash2} onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-slate-600">Are you sure you want to delete <b>{basic.collegeName}</b>? This action cannot be undone.</p>
      </Modal>
      <Modal open={privateWarning} title="Private consultancy data" tone="danger" onClose={() => setPrivateWarning(false)} footer={<Button onClick={() => setPrivateWarning(false)}>Continue</Button>}>
        <p className="text-sm leading-6 text-slate-600">This section contains internal consultancy data such as incentive, donation, negotiation, and counsellor notes. Only admin users should view it.</p>
      </Modal>
    </div>
  );
}

function DetailSections({ college, activeTab }) {
  const basic = college.basicInfo || {};
  const approval = college.affiliationApproval || {};
  if (activeTab === "Basic Info") return <div className="no-print grid gap-4 lg:grid-cols-2"><UiCard><InfoCard title="Basic Information" items={basic} /></UiCard><UiCard><InfoCard title="Review & Recommendation" items={college.reviewRecommendation} /></UiCard></div>;
  if (activeTab === "Approvals") return <div className="no-print"><UiCard><InfoCard title="Affiliation & Approval" items={approval} /></UiCard></div>;
  if (activeTab === "Admission") return <div className="no-print"><UiCard><InfoCard title="Admission" items={college.admission} /></UiCard></div>;
  if (activeTab === "Placements") return <div className="no-print"><UiCard><InfoCard title="Placements" items={college.placements} /></UiCard></div>;
  if (activeTab === "Facilities") return <UiCard><h3 className="mb-3 text-xl font-extrabold">Facilities</h3><p className="text-base text-slate-700">{(college.facilities || []).join(", ") || "Not Added"}</p><p className="mt-4 text-base text-slate-700"><b>Warnings:</b> {(college.warnings || []).join(", ") || "Not Added"}</p><p className="mt-2 text-base text-slate-600">{college.warningNotes}</p></UiCard>;
  if (activeTab === "Sources") return <UiCard><h3 className="mb-3 text-xl font-extrabold">Source Links</h3><div className="space-y-2">{(college.sourceLinks || []).map((s, i) => <a key={i} href={s.url} target="_blank" className="block break-all rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">{s.title || s.url}</a>)}</div></UiCard>;
  if (activeTab === "Courses") {
    return (
      <UiCard className="no-print">
        <h3 className="mb-3 text-xl font-extrabold">Courses</h3>
        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead><tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{["Course", "Degree", "Stream", "Duration", "Eligibility", "Fee", "Seats", "Mode"].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
            <tbody>{(college.courses || []).map((c, i) => <tr key={i} className="border-b align-top"><td className="px-3 py-3 font-semibold text-slate-950">{c.courseName || <Muted />}</td><td className="px-3 py-3">{c.degreeType || <Muted />}</td><td className="px-3 py-3">{c.stream || <Muted />}</td><td className="px-3 py-3">{c.duration || <Muted />}</td><td className="px-3 py-3">{c.eligibility || <Muted />}</td><td className="px-3 py-3">{c.totalFee ?? <Muted />}</td><td className="px-3 py-3">{c.seatIntake ?? <Muted />}</td><td className="px-3 py-3">{c.mode || <Muted />}</td></tr>)}</tbody>
          </table>
        </div>
      </UiCard>
    );
  }
  if (activeTab === "Private") return null;
  return (
    <div className="no-print grid gap-4 lg:grid-cols-2">
      <Card title="Basic Information" items={basic} />
      <Card title="Affiliation & Approval" items={approval} />
      <Card title="Admission" items={college.admission} />
      <Card title="Placements" items={college.placements} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h3 className="mb-3 text-xl font-extrabold">Courses</h3>
        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead><tr className="border-b">{["Course", "Degree", "Stream", "Duration", "Eligibility", "Fee", "Seats", "Mode"].map((h) => <th key={h} className="py-2">{h}</th>)}</tr></thead>
            <tbody>{(college.courses || []).map((c, i) => <tr key={i} className="border-b"><td>{c.courseName || <Muted />}</td><td>{c.degreeType || <Muted />}</td><td>{c.stream || <Muted />}</td><td>{c.duration || <Muted />}</td><td>{c.eligibility || <Muted />}</td><td>{c.totalFee ?? <Muted />}</td><td>{c.seatIntake ?? <Muted />}</td><td>{c.mode || <Muted />}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <Card title="Review & Recommendation" items={college.reviewRecommendation} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-xl font-extrabold">Warnings, Facilities, Sources</h3>
        <p className="text-sm"><b>Facilities:</b> {(college.facilities || []).join(", ")}</p>
        <p className="mt-2 text-sm"><b>Warnings:</b> {(college.warnings || []).join(", ")}</p>
        <p className="mt-2 text-sm">{college.warningNotes}</p>
        <div className="mt-3 space-y-1">{(college.sourceLinks || []).map((s, i) => <a key={i} href={s.url} target="_blank" className="block break-all text-sm font-semibold text-blue-700 hover:underline">{s.title || s.url}</a>)}</div>
      </section>
    </div>
  );
}

function InfoCard({ title, items = {} }) {
  return <><h3 className="mb-3 font-bold">{title}</h3><DataList items={items} /></>;
}

function Card({ title, items = {} }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-xl font-extrabold">{title}</h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {Object.entries(items || {}).map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs uppercase text-slate-500">{key.replace(/([A-Z])/g, " $1")}</dt>
            <dd className="font-medium">{renderValue(value, key)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DataList({ items = {} }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {Object.entries(items || {}).map(([key, value]) => (
        <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{key.replace(/([A-Z])/g, " $1")}</dt>
          <dd className="mt-1 font-semibold text-slate-800">{renderValue(value, key)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Muted() {
  return <span className="text-slate-400">Not Added</span>;
}

function renderValue(value, key = "") {
  if (value === null || value === undefined || value === "") return <Muted />;
  if (/website|url/i.test(key) && typeof value === "string" && /^https?:\/\//i.test(value)) {
    return <a href={value} target="_blank" rel="noreferrer" className="break-all text-blue-700 hover:underline">{value}</a>;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <Muted />;
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, index) => <span key={`${String(item)}-${index}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{renderPlainValue(item)}</span>)}
      </div>
    );
  }
  if (typeof value === "object") return <span className="break-words text-sm leading-6 text-slate-700">{renderPlainValue(value)}</span>;
  return String(value);
}

function renderPlainValue(value) {
  if (value === null || value === undefined || value === "") return "Not Added";
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, itemValue]) => itemValue !== "" && itemValue !== null && itemValue !== undefined)
      .map(([key, itemValue]) => `${key.replace(/([A-Z])/g, " $1")}: ${Array.isArray(itemValue) ? itemValue.join(", ") : String(itemValue)}`)
      .join(" | ") || "Not Added";
  }
  return String(value);
}

function PrivateConsultancyPanel({ collegeId, token, privateData, setPrivateData }) {
  const [saving, setSaving] = useState(false);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    if (!token || privateData) return;
    privateApi.getCollege(collegeId).then((result) => {
      setPrivateData(result.privateConsultancyDetails || {});
      setDebug(result.extractionDebug || null);
    }).catch(() => toast.error("Unable to load private consultancy details"));
  }, [collegeId, token, privateData, setPrivateData]);

  async function savePrivate() {
    setSaving(true);
    try {
      const result = await privateApi.updateCollege(collegeId, privateData);
      setPrivateData(result.privateConsultancyDetails || {});
      toast.success("Private consultancy details saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Private save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <div className="no-print rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
        <h3 className="flex items-center gap-2 font-bold text-amber-950"><Lock size={18} /> Private Consultancy Details <span className="rounded bg-rose-700 px-2 py-1 text-xs text-white">ADMIN ONLY</span></h3>
        <p className="mt-3 text-sm text-amber-900">Admin session required.</p>
      </div>
    );
  }

  const data = privateData || {};
  const update = (field, value) => setPrivateData({ ...data, [field]: value });

  return (
    <section className="no-print rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
      <h3 className="flex items-center gap-2 font-bold text-amber-950"><Lock size={18} /> Private Consultancy Details <span className="rounded bg-rose-700 px-2 py-1 text-xs text-white">ADMIN ONLY</span></h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {["consultancyNotes", "internalRemarks", "preferredCounsellor", "directAdmissionAvailable", "managementQuotaAvailable", "hostelCommissionAvailable", "specialScholarshipAvailable", "lastUpdatedBy", "lastNegotiatedDate"].map((field) => (
          <label key={field} className="text-sm">
            <span className="mb-1 block font-medium">{field.replace(/([A-Z])/g, " $1")}</span>
            <textarea className="w-full rounded-md border px-3 py-2" rows={2} value={data[field] || ""} onChange={(e) => update(field, e.target.value)} />
          </label>
        ))}
      </div>
      <button disabled={saving} onClick={savePrivate} className="mt-4 rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white">{saving ? "Saving..." : "Save Private Details"}</button>
      {debug && (
        <div className="mt-5 rounded-md border border-orange-300 bg-white p-3 text-sm">
          <p className="font-semibold text-orange-900">Extraction Debug</p>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <span>Mode: {debug.extractionMode || "quick"}</span>
            <span>Sources: {debug.sourceCount || 0}</span>
            <span>Scraped: {debug.scrapedUrlCount || 0}</span>
            <span>Brochures: {debug.brochureCount || 0}</span>
          </div>
          <div className="mt-3 max-h-40 overflow-auto rounded border bg-slate-50 p-2 text-xs">
            {(debug.foundUrls || []).slice(0, 80).map((url, index) => <p key={`${url}-${index}`} className="break-all">{url}</p>)}
          </div>
        </div>
      )}
    </section>
  );
}
