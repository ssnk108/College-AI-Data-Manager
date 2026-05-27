import { CheckCircle2, FileSearch, Globe2, Loader2, ScanSearch, Sparkles } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { collegeApi } from "../api/client.js";
import { TextArea, TextInput } from "../components/FormControls.jsx";
import { Badge, Button, Card, Modal, PageHeader } from "../components/ui.jsx";

const progressSteps = [
  "Normalizing college name",
  "Searching trusted sources",
  "Scraping websites",
  "Reading PDFs",
  "Extracting with AI",
  "Checking missing fields",
  "Finalizing preview"
];

export default function AddAI() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
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
    setShowProgress(true);
    try {
      const data = await collegeApi.aiExtract({
        ...form,
        sourceUrls: form.sourceUrls.split("\n").map((url) => url.trim()).filter(Boolean)
      });
      toast.success("AI draft ready. Please review before saving.");
      navigate("/admin/manual", { state: { prefill: data } });
    } catch (error) {
      toast.error(error.response?.data?.message || "AI extraction failed. Please check backend logs and try again.");
    } finally {
      setLoading(false);
      setShowProgress(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI Auto Fill"
        title="Research and auto-fill college data"
        description="Enter a college name and optional location. The engine searches trusted sources, scrapes websites, reads PDFs, extracts structured data, and opens an editable preview before saving."
        actions={<Badge tone="indigo">No automatic save</Badge>}
      />
      <form onSubmit={handleGenerate}>
        <Card className="mx-auto max-w-5xl">
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <InfoTile icon={ScanSearch} label="Adaptive search" text="Official sites, trusted portals, PDFs" />
            <InfoTile icon={FileSearch} label="Deep extraction" text="Courses, fees, placements, approvals" />
            <InfoTile icon={Globe2} label="Source tracking" text="Every useful URL stays attached" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="College name" required value={form.collegeName} onChange={(v) => setForm({ ...form, collegeName: v })} helper="Short names and typos are okay." />
            <TextInput label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <TextInput label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
            <TextInput label="Official website URL" value={form.officialWebsite} onChange={(v) => setForm({ ...form, officialWebsite: v })} placeholder="https://college.edu" />
            <SelectField label="Extraction mode" value={form.extractionMode} onChange={(v) => setForm({ ...form, extractionMode: v })} options={[["quick", "Quick Extraction"], ["deep", "Deep Research Extraction"]]} />
            <SelectField label="Is direct admission available?" value={form.directAdmissionAvailable} onChange={(v) => setForm({ ...form, directAdmissionAvailable: v })} options={["Not Sure", "Yes", "No"].map((x) => [x, x])} />
            <SelectField label="College ownership guess" value={form.ownershipInput} onChange={(v) => setForm({ ...form, ownershipInput: v })} options={["Not Sure", "Government", "Private", "Semi-Government"].map((x) => [x, x])} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <TextArea label="Admission note optional" rows={4} value={form.admissionNote} onChange={(v) => setForm({ ...form, admissionNote: v })} />
            <TextArea label="Extra source URLs, one per line" rows={4} value={form.sourceUrls} onChange={(v) => setForm({ ...form, sourceUrls: v })} helper="Official, admission, fee, placement, approval, and brochure URLs help quality." />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-sm text-slate-500">AI data opens in the editable form first.</p>
            <Button type="submit" loading={loading} icon={Sparkles} className="px-6 py-3">
              {loading ? "Researching..." : "Start AI Research"}
            </Button>
          </div>
        </Card>
      </form>
      <ResearchProgressModal open={showProgress} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field">
        {options.map(([optionValue, labelText]) => <option key={optionValue} value={optionValue}>{labelText}</option>)}
      </select>
    </label>
  );
}

function InfoTile({ icon: Icon, label, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Icon className="text-indigo-600" size={22} />
      <p className="mt-3 font-bold text-slate-950">{label}</p>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </div>
  );
}

function ResearchProgressModal({ open }) {
  return (
    <Modal open={open} title="AI research in progress" tone="success">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-4 text-indigo-800">
          <Loader2 className="animate-spin" size={22} />
          <div>
            <p className="font-bold">Searching and extracting college data...</p>
            <p className="text-sm text-indigo-700">Deep research can take a little longer for large university websites.</p>
          </div>
        </div>
        <div className="space-y-2">
          {progressSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              {index < 2 ? <CheckCircle2 className="text-emerald-500" size={18} /> : <div className="h-4 w-4 rounded-full border-2 border-indigo-200" />}
              <span className="text-sm font-medium text-slate-700">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
