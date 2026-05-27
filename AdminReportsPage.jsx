import { Download, Eye, FileText, Filter, Plus, RefreshCw, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminReportsApi } from "./frontend/src/api/client.js";
import { Badge, Button, Card, Modal, PageHeader, Skeleton } from "./components/ui.jsx";

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [filters, setFilters] = useState({ state: "", city: "", course: "", ownership: "", approval: "", verificationStatus: "" });
  const [metrics, setMetrics] = useState({ total: 420, verified: 315, placement: 280, missing: 45 });

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const data = await adminReportsApi.list();
      setReports(data || []);
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(type) {
    setGenerating(true);
    try {
      await adminReportsApi.generate({ type, filters });
      toast.success(`${type} report generated successfully`);
      fetchReports();
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Tools"
        title="Reports & Analytics"
        description="Generate and manage structured college reports for consultancy and public use."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total Colleges" value={metrics.total} />
        <MetricCard label="Verified" value={metrics.verified} tone="emerald" />
        <MetricCard label="Placement Data" value={metrics.placement} tone="indigo" />
        <MetricCard label="Missing Data" value={metrics.missing} tone="amber" />
        <MetricCard label="Reports Generated" value={reports.length} />
        <MetricCard label="Last Updated" value="Today" />
      </div>

      <Card title="Generate New Report">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <select className="field" value={filters.state} onChange={(e) => setFilters({...filters, state: e.target.value})}><option value="">All States</option></select>
          <input className="field" placeholder="City" value={filters.city} onChange={(e) => setFilters({...filters, city: e.target.value})} />
          <input className="field" placeholder="Course" value={filters.course} onChange={(e) => setFilters({...filters, course: e.target.value})} />
          <select className="field" value={filters.ownership} onChange={(e) => setFilters({...filters, ownership: e.target.value})}><option value="">Ownership</option></select>
          <select className="field" value={filters.verificationStatus} onChange={(e) => setFilters({...filters, verificationStatus: e.target.value})}><option value="">Verification</option></select>
          <Button icon={Plus} loading={generating} onClick={() => handleGenerate("Filtered")}>Generate</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleGenerate("Full Database")}>Full DB Export</Button>
          <Button variant="secondary" size="sm" onClick={() => handleGenerate("State-wise Summary")}>State-wise Summary</Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Report Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Generated Date</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-4"><Skeleton className="h-10" /></td></tr>
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold">{report.title}</td>
                    <td className="px-4 py-3">{report.type}</td>
                    <td className="px-4 py-3">{report.date}</td>
                    <td className="px-4 py-3"><Badge>{report.format}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button title="View" onClick={() => setPreviewReport(report)} className="p-1 text-slate-500 hover:text-indigo-600"><Eye size={18} /></button>
                        <button title="Download" className="p-1 text-slate-500 hover:text-blue-600"><Download size={18} /></button>
                        <button title="Delete" className="p-1 text-slate-500 hover:text-rose-600"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <FileText size={48} />
                      <p className="mt-2 font-semibold">No reports generated yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!previewReport} title="Report Preview" onClose={() => setPreviewReport(null)}>
        <div className="space-y-4">
           <div className="aspect-[1/1.4] w-full rounded border bg-slate-100 flex items-center justify-center">
             <p className="text-slate-400 italic">Interactive PDF/Data Preview Loader...</p>
           </div>
           <div className="flex justify-end gap-3">
             <Button variant="secondary" onClick={() => setPreviewReport(null)}>Close</Button>
             <Button icon={Download}>Download PDF</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}

function MetricCard({ label, value, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700"
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tones[tone].split(' ')[1]}`}>{value}</p>
    </div>
  );
}