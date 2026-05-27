import { Download, Edit, EyeOff, FileJson, Lock, Printer, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authApi, collegeApi, privateApi } from "../api/client.js";
import A4Report from "../components/A4Report.jsx";
import { ConfidenceBadge, VerificationBadge } from "../components/Badges.jsx";
import { exportJson, exportXlsx } from "../utils.js";

export default function CollegeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [college, setCollege] = useState(null);
  const [hidePrivate, setHidePrivate] = useState(new URLSearchParams(window.location.search).has("public"));
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken") || "");
  const [privateData, setPrivateData] = useState(null);

  useEffect(() => {
    collegeApi
      .get(id)
      .then(setCollege)
      .catch(() => toast.error("Unable to load college"));
  }, [id]);

  useEffect(() => {
    function onKey(event) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "h") setHidePrivate((value) => !value);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleDelete() {
    if (!confirm("Delete this college?")) return;
    await collegeApi.remove(id);
    toast.success("College deleted");
    navigate("/colleges");
  }

  if (!college) return <p className="rounded-lg bg-white p-6">Loading college...</p>;

  const basic = college.basicInfo || {};

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">{basic.collegeName}</h2>
          <p className="text-sm text-slate-600">{basic.city}, {basic.state}</p>
          <div className="mt-2 flex gap-2"><VerificationBadge status={college.verificationStatus} /><ConfidenceBadge score={college.confidenceScore} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/colleges/${id}/edit`} className="inline-flex items-center gap-2 rounded-md bg-ocean px-3 py-2 text-sm font-semibold text-white"><Edit size={16} /> Edit</Link>
          <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white"><Trash2 size={16} /> Delete</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"><Printer size={16} /> Download A4 Report</button>
          <button onClick={() => exportJson(college)} className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"><FileJson size={16} /> Export JSON</button>
          <button onClick={() => exportXlsx([college])} className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"><Download size={16} /> Export XLSX</button>
          <button onClick={() => setHidePrivate((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900"><EyeOff size={16} /> Hide Consultancy Data</button>
          <button onClick={() => window.open(`/colleges/${id}?public=1`, "_blank")} className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">Open Public View</button>
        </div>
      </div>

      <DetailSections college={college} />
      {!hidePrivate && (
        <PrivateConsultancyPanel
          collegeId={id}
          token={adminToken}
          setToken={setAdminToken}
          privateData={privateData}
          setPrivateData={setPrivateData}
        />
      )}
      <A4Report college={college} />
    </div>
  );
}

function DetailSections({ college }) {
  const basic = college.basicInfo || {};
  const approval = college.affiliationApproval || {};
  return (
    <div className="no-print grid gap-4 lg:grid-cols-2">
      <Card title="Basic Information" items={basic} />
      <Card title="Affiliation & Approval" items={approval} />
      <Card title="Admission" items={college.admission} />
      <Card title="Placements" items={college.placements} />
      <section className="rounded-lg bg-white p-4 shadow-sm lg:col-span-2">
        <h3 className="mb-3 font-semibold">Courses</h3>
        <div className="overflow-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead><tr className="border-b">{["Course", "Degree", "Stream", "Duration", "Eligibility", "Fee", "Seats", "Mode"].map((h) => <th key={h} className="py-2">{h}</th>)}</tr></thead>
            <tbody>{(college.courses || []).map((c, i) => <tr key={i} className="border-b"><td>{c.courseName || <Muted />}</td><td>{c.degreeType || <Muted />}</td><td>{c.stream || <Muted />}</td><td>{c.duration || <Muted />}</td><td>{c.eligibility || <Muted />}</td><td>{c.totalFee ?? <Muted />}</td><td>{c.seatIntake ?? <Muted />}</td><td>{c.mode || <Muted />}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <Card title="Review & Recommendation" items={college.reviewRecommendation} />
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Warnings, Facilities, Sources</h3>
        <p className="text-sm"><b>Facilities:</b> {(college.facilities || []).join(", ")}</p>
        <p className="mt-2 text-sm"><b>Warnings:</b> {(college.warnings || []).join(", ")}</p>
        <p className="mt-2 text-sm">{college.warningNotes}</p>
        <div className="mt-3 space-y-1">{(college.sourceLinks || []).map((s, i) => <a key={i} href={s.url} target="_blank" className="block break-all text-sm text-ocean">{s.title || s.url}</a>)}</div>
      </section>
    </div>
  );
}

function Card({ title, items = {} }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {Object.entries(items || {}).map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs uppercase text-slate-500">{key.replace(/([A-Z])/g, " $1")}</dt>
            <dd className="font-medium">{value || <Muted />}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Muted() {
  return <span className="text-slate-400">Not Added</span>;
}

function PrivateConsultancyPanel({ collegeId, token, setToken, privateData, setPrivateData }) {
  const [login, setLogin] = useState({ email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [debug, setDebug] = useState(null);

  async function handleLogin(event) {
    event.preventDefault();
    try {
      const result = await authApi.login(login);
      localStorage.setItem("adminToken", result.token);
      setToken(result.token);
      const privateResult = await privateApi.getCollege(collegeId, result.token);
      setPrivateData(privateResult.privateConsultancyDetails || {});
      setDebug(privateResult.extractionDebug || null);
      toast.success("Admin unlocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Admin login failed");
    }
  }

  useEffect(() => {
    if (!token || privateData) return;
    privateApi.getCollege(collegeId, token).then((result) => {
      setPrivateData(result.privateConsultancyDetails || {});
      setDebug(result.extractionDebug || null);
    }).catch(() => {
      localStorage.removeItem("adminToken");
      setToken("");
    });
  }, [collegeId, token, privateData, setPrivateData, setToken]);

  async function savePrivate() {
    setSaving(true);
    try {
      const result = await privateApi.updateCollege(collegeId, token, privateData);
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
      <form onSubmit={handleLogin} className="no-print rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
        <h3 className="flex items-center gap-2 font-bold text-amber-950"><Lock size={18} /> Private Consultancy Details <span className="rounded bg-rose-700 px-2 py-1 text-xs text-white">ADMIN ONLY</span></h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Admin email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Password" type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
          <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Unlock Admin View</button>
        </div>
      </form>
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
