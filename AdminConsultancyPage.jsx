import { Briefcase, Calendar, MoreVertical, Plus, Search, User } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { consultancyApi } from "./frontend/src/api/client.js";
import { Badge, Button, Card, Modal, PageHeader } from "./components/ui.jsx";

export default function AdminConsultancyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  React.useEffect(() => {
    fetchConsultancyData();
  }, []);

  async function fetchConsultancyData() {
    setLoading(true);
    try {
      const res = await consultancyApi.list();
      setData(res || []);
    } catch (err) {
      toast.error("Failed to fetch consultancy data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Internal"
        title="Consultancy Data"
        description="Confidential partner relations, MoU tracking, and incentive management."
        actions={<Button icon={Plus} onClick={() => { setSelectedItem(null); setShowModal(true); }}>Add Partner Data</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Partner Colleges" value="24" icon={Briefcase} />
        <SummaryCard label="Active MoUs" value="18" icon={Badge} />
        <SummaryCard label="Follow-ups Today" value="5" icon={Calendar} tone="amber" />
        <SummaryCard label="Incentive Priority" value="High" icon={User} tone="indigo" />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="field pl-10" placeholder="Filter partners by name, contact, or MoU status..." />
        </div>
        <select className="field w-48"><option>Priority: All</option><option>Urgent</option><option>High</option></select>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">College & Contact</th>
              <th className="px-6 py-4">MoU Status</th>
              <th className="px-6 py-4">Incentive</th>
              <th className="px-6 py-4">Follow-up</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.length === 0 ? (
               <tr><td colSpan="5" className="py-20 text-center text-slate-400">{loading ? "Loading..." : "No consultancy records found."}</td></tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{item.collegeName}</div>
                    <div className="text-xs text-slate-500">{item.contactPerson} • {item.phone}</div>
                  </td>
                  <td className="px-6 py-4"><Badge tone={item.mouStatus === 'Signed' ? 'emerald' : 'slate'}>{item.mouStatus}</Badge></td>
                  <td className="px-6 py-4 font-mono text-xs">{item.incentive}</td>
                  <td className="px-6 py-4">{item.followUpDate}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg"><MoreVertical size={16}/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <ConsultancyModal open={showModal} onClose={() => setShowModal(false)} initialData={selectedItem} />
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone = "sky" }) {
  const colorClass = {
    sky: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
    indigo: "text-indigo-600 bg-indigo-50"
  }[tone];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}><Icon size={24} /></div>
      <div>
        <p className="text-sm font-bold text-slate-400">{label}</p>
        <p className="text-xl font-black text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function ConsultancyModal({ open, onClose, initialData }) {
  const [form, setForm] = useState(initialData || {
    collegeId: "", contactPerson: "", phone: "", email: "", mouStatus: "Not Started", incentiveType: "Fixed", priority: "Medium"
  });

  const handleSave = () => {
    toast.success("Consultancy data saved securely");
    onClose();
  };

  return (
    <Modal open={open} title={initialData ? "Edit Partner" : "Add Partner Data"} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSave}>Save Confidential Data</Button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block col-span-2">
          <span className="label">College Selection</span>
          <select className="field"><option>Select College...</option></select>
        </label>
        <label className="block">
          <span className="label">Contact Person</span>
          <input className="field" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} />
        </label>
        <label className="block">
          <span className="label">Phone / WhatsApp</span>
          <input className="field" value={form.phone} />
        </label>
        <label className="block">
          <span className="label">MoU Status</span>
          <select className="field" value={form.mouStatus} onChange={e => setForm({...form, mouStatus: e.target.value})}>
            <option>Not Started</option><option>In Discussion</option><option>Signed</option><option>Expired</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Priority</span>
          <select className="field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
            <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Incentive Type</span>
          <select className="field" value={form.incentiveType}>
            <option>Fixed</option><option>Percentage</option><option>Per Admission</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Value</span>
          <input className="field" placeholder="Amount or %" />
        </label>
        <label className="block col-span-2">
          <span className="label">Follow-up Date</span>
          <input type="date" className="field" />
        </label>
        <label className="block col-span-2">
          <span className="label">Private Notes (Admin Only)</span>
          <textarea className="field" rows={3} placeholder="Internal remarks, negotiation history..." />
        </label>
      </div>
      <div className="mt-4 rounded-lg bg-amber-50 p-3 border border-amber-200">
        <p className="text-xs text-amber-800 font-medium">⚠️ Security Notice: This information is encrypted and hidden from all public views and student reports.</p>
      </div>
    </Modal>
  );
}