import { ArrowLeftRight, Check, History, Layers, ShieldAlert, X } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { mergeQueueApi } from "./frontend/src/api/client.js";
import { Badge, Button, Card, Modal, PageHeader } from "./components/ui.jsx";

export default function AdminMergeQueuePage() {
  const [queue, setQueue] = useState([]);
  const [comparing, setComparing] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    setLoading(true);
    try {
      const data = await mergeQueueApi.list();
      setQueue(data || []);
    } catch (err) {
      toast.error("Error loading merge queue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Integrity"
        title="Merge Queue"
        description="Identify and resolve duplicate college entries to maintain a clean database."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
          <div><p className="text-sm font-bold text-slate-400">Possible Duplicates</p><p className="text-2xl font-black">12</p></div>
          <ShieldAlert className="text-amber-500" size={32} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
          <div><p className="text-sm font-bold text-slate-400">Pending Reviews</p><p className="text-2xl font-black">8</p></div>
          <History className="text-indigo-500" size={32} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
          <div><p className="text-sm font-bold text-slate-400">Merged (Monthly)</p><p className="text-2xl font-black">45</p></div>
          <Layers className="text-emerald-500" size={32} />
        </div>
      </div>

      <Card>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Potential Duplicate Pair</th>
              <th className="px-6 py-4">Match Confidence</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {queue.length === 0 ? (
               <tr><td colSpan="4" className="py-20 text-center text-slate-400">Queue is empty. Everything looks clean!</td></tr>
            ) : (
               <tr>{/* Rows here */}</tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={!!comparing} title="Compare & Merge Records" onClose={() => setComparing(null)} className="max-w-6xl">
        <div className="grid gap-6 md:grid-cols-2">
          <ComparisonColumn title="Existing Record" data={{}} />
          <ComparisonColumn title="Detected Duplicate" data={{}} isNew />
        </div>
        <div className="mt-8 flex justify-between border-t pt-5">
           <Button variant="ghost" icon={X} onClick={() => setComparing(null)}>Ignore (Not Duplicates)</Button>
           <div className="flex gap-3">
             <Button variant="secondary" onClick={() => setComparing(null)}>Keep Both</Button>
             <Button icon={Check} onClick={() => { toast.success("Records merged successfully"); setComparing(null); }}>Smart Merge</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}

function ComparisonColumn({ title, data, isNew = false }) {
  return (
    <div className={`rounded-xl border p-4 ${isNew ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-black text-slate-900">{title}</h4>
        <Badge tone={isNew ? 'indigo' : 'slate'}>{isNew ? 'Source: AI Fill' : 'Source: DB'}</Badge>
      </div>
      <div className="space-y-3">
        <CompareField label="College Name" value="Example Institute of Tech" match />
        <CompareField label="Website" value="https://example.edu" match />
        <CompareField label="City" value="Kolkata" match />
        <CompareField label="State" value="West Bengal" match />
        <CompareField label="Ownership" value={isNew ? "Private" : "Semi-Govt"} mismatch />
        <CompareField label="Courses" value="B.Tech, MBA, BCA" />
      </div>
    </div>
  );
}

function CompareField({ label, value, match, mismatch }) {
  return (
    <div className="group">
      <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
        <span>{label}</span>
        {match && <span className="text-emerald-500">Match</span>}
        {mismatch && <span className="text-rose-500">Conflict</span>}
      </div>
      <div className={`mt-1 rounded-lg border bg-white p-2.5 text-sm font-semibold text-slate-800 ${mismatch ? 'border-rose-200 ring-2 ring-rose-50' : 'border-slate-200'}`}>
        {value || "-"}
      </div>
    </div>
  );
}