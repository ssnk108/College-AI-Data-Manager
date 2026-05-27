import { Code, Copy, Play, RefreshCcw, Search, Terminal } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { debugApi } from "./frontend/src/api/client.js";
import { Badge, Button, Card, PageHeader } from "./components/ui.jsx";

export default function AdminExtractionDebugPage() {
  const [logs, setLogs] = useState([]);
  const [activeLog, setActiveLog] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const data = await debugApi.listLogs();
      setLogs(data || []);
    } catch (err) {
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dev Tools"
        title="Extraction Debugger"
        description="Inspect raw AI responses, scraping logs, and data normalization pipelines."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Attempts" value="1,240" />
        <StatCard label="Success Rate" value="94.2%" tone="emerald" />
        <StatCard label="Failures" value="72" tone="rose" />
        <StatCard label="Avg Time" value="14s" />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="field pl-10" placeholder="Filter by college or error message..." />
        </div>
        <Button icon={Play} variant="secondary">Run Health Check</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">College / Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr><td colSpan="4" className="py-20 text-center text-slate-400">No recent extraction logs.</td></tr>
              ) : (
                logs.map(log => (
                   <tr key={log.id} onClick={() => setActiveLog(log)} className="cursor-pointer hover:bg-slate-50">
                     {/* Cells */}
                   </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black">Log Detail</h3>
            <Badge tone="indigo">AI-JSON</Badge>
          </div>
          
          <div className="flex-1 rounded-xl bg-slate-900 p-4 font-mono text-xs text-indigo-300 overflow-auto max-h-[500px]">
            {activeLog ? (
              <pre>{JSON.stringify(activeLog, null, 2)}</pre>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 italic">
                Select a log entry to view raw extraction JSON
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" size="sm" icon={Copy} variant="secondary">Copy JSON</Button>
            <Button className="flex-1" size="sm" icon={RefreshCcw}>Retry</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone = "slate" }) {
  const toneClass = {
    slate: "text-slate-600",
    emerald: "text-emerald-600",
    rose: "text-rose-600"
  }[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}