import { Database, Eye, Globe, Lock, Palette, Save, ShieldCheck, Trash2 } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { settingsApi } from "./frontend/src/api/client.js";
import { Badge, Button, Card, Modal, PageHeader, Tabs } from "./components/ui.jsx";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const [confirmClear, setConfirmClear] = useState(false);
  const [settings, setSettings] = useState({});

  React.useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const data = await settingsApi.get();
      setSettings(data || {});
    } catch (err) {
      toast.error("Failed to load platform settings");
    }
  }

  const tabs = ["General", "Branding", "Admin", "Data", "Public View", "Backup"];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Platform Settings"
        description="Manage global site settings, branding, security, and data preferences."
      />

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="grid gap-6">
        {activeTab === "General" && (
          <Card title="Website Configuration">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className="label">Site Name</span><input className="field" defaultValue="Aspire College" /></label>
              <label className="block"><span className="label">Contact Email</span><input className="field" defaultValue="admin@aspire.edu" /></label>
              <label className="block"><span className="label">Support Phone</span><input className="field" defaultValue="+91 9876543210" /></label>
              <label className="block"><span className="label">Default State</span><input className="field" defaultValue="West Bengal" /></label>
            </div>
          </Card>
        )}

        {activeTab === "Branding" && (
          <Card title="Visual Identity">
             <div className="flex items-center gap-8">
                <div className="h-24 w-24 rounded-2xl bg-slate-100 border border-dashed flex items-center justify-center text-slate-400">Logo</div>
                <div className="space-y-3 flex-1">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-600 ring-4 ring-blue-100"></div>
                    <div className="h-10 w-10 rounded-full bg-indigo-600 ring-4 ring-indigo-100"></div>
                    <div className="h-10 w-10 rounded-full bg-slate-900 ring-4 ring-slate-100"></div>
                  </div>
                  <Button variant="secondary" size="sm">Upload New Logo</Button>
                </div>
             </div>
          </Card>
        )}

        {activeTab === "Data" && (
          <Card title="Management Rules">
             <div className="space-y-4">
                <ToggleSetting label="Strict Duplicate Checking" description="Block creation if similar college name/website exists." checked />
                <ToggleSetting label="Auto-Merge Low Confidence" description="Automatically merge records with >95% confidence score." />
                <ToggleSetting label="Require Verification" description="New records are hidden until verified by an admin." checked />
             </div>
          </Card>
        )}

        {activeTab === "Backup" && (
           <div className="grid gap-4 md:grid-cols-2">
             <Card title="Export Data">
                <p className="text-sm text-slate-500 mb-4">Download a full snapshot of your database for offline backup or migration.</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">JSON Backup</Button>
                  <Button variant="secondary" size="sm">XLSX Export</Button>
                </div>
             </Card>
             <Card title="Danger Zone" className="border-rose-100 bg-rose-50/30">
                <p className="text-sm text-rose-800 font-bold mb-4">Destructive Operations</p>
                <div className="flex gap-2">
                   <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>Clear All Debug Logs</Button>
                </div>
             </Card>
           </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button icon={Save} onClick={() => toast.success("Settings updated")}>Save Changes</Button>
      </div>

      <Modal open={confirmClear} title="Clear Debug Logs?" tone="danger" onClose={() => setConfirmClear(false)} footer={<><Button variant="secondary" onClick={() => setConfirmClear(false)}>Cancel</Button><Button variant="danger" onClick={() => { toast.success("Logs cleared"); setConfirmClear(false); }}>Delete Forever</Button></>}>
        <p className="text-sm text-slate-600">This will delete all historical extraction and scraping logs. This action is permanent.</p>
      </Modal>
    </div>
  );
}

function ToggleSetting({ label, description, checked = false }) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-4 bg-white">
      <div>
        <p className="font-bold text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className={`h-6 w-11 rounded-full p-1 transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <div className={`h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
    </div>
  );
}