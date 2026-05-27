import { Loader2, Sparkles } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { collegeApi } from "../api/client.js";
import { TextArea, TextInput } from "../components/FormControls.jsx";

export default function AddAI() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    collegeName: "",
    city: "",
    state: "",
    officialWebsite: "",
    extractionMode: "quick",
    directAdmissionAvailable: "Not Sure",
    ownershipInput: "Not Sure",
    admissionNote: "",
    sourceUrls: ""
  });

  async function handleGenerate(event) {
    event.preventDefault();
    if (!form.collegeName.trim()) {
      toast.error("College name is required");
      return;
    }

    setLoading(true);
    try {
      const data = await collegeApi.aiExtract({
        ...form,
        sourceUrls: form.sourceUrls.split("\n").map((url) => url.trim()).filter(Boolean)
      });
      toast.success("AI draft ready. Please review before saving.");
      navigate("/add-manual", { state: { prefill: data } });
    } catch (error) {
      toast.error(error.response?.data?.message || "AI extraction failed. Please check backend logs and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleGenerate} className="mx-auto max-w-3xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">AI Auto Fill</p>
        <h2 className="text-2xl font-bold">Extract College Data with AI</h2>
        <p className="mt-1 text-sm text-slate-600">The generated data opens in the editable form first. It is not saved automatically.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="College name" required value={form.collegeName} onChange={(v) => setForm({ ...form, collegeName: v })} />
        <TextInput label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <TextInput label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
        <TextInput label="Official website URL" value={form.officialWebsite} onChange={(v) => setForm({ ...form, officialWebsite: v })} placeholder="https://college.edu" />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Extraction mode</span>
          <select value={form.extractionMode} onChange={(event) => setForm({ ...form, extractionMode: event.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="quick">Quick Extraction</option>
            <option value="deep">Deep Research Extraction</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Is direct admission available?</span>
          <select value={form.directAdmissionAvailable} onChange={(event) => setForm({ ...form, directAdmissionAvailable: event.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option>Not Sure</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">College ownership guess</span>
          <select value={form.ownershipInput} onChange={(event) => setForm({ ...form, ownershipInput: event.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option>Not Sure</option>
            <option>Government</option>
            <option>Private</option>
            <option>Semi-Government</option>
          </select>
        </label>
      </div>
      <TextArea label="Admission note optional" rows={3} value={form.admissionNote} onChange={(v) => setForm({ ...form, admissionNote: v })} />
      <TextArea label="Extra source URLs, one per line" rows={6} value={form.sourceUrls} onChange={(v) => setForm({ ...form, sourceUrls: v })} />
      <button disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-ocean px-5 py-3 font-semibold text-white disabled:opacity-60">
        {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
        {loading ? "Searching and extracting college data..." : "Extract with AI"}
      </button>
    </form>
  );
}
