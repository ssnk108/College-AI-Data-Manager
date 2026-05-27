import { Lock } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext.jsx";
import { Button, Card } from "../components/ui.jsx";

export default function AdminLoginPage() {
  const { isAdmin, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.adminRequired) toast.error("Admin login required");
  }, [location.state]);

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-800 bg-white">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <Lock size={22} />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black">Admin Management Panel</h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">Secure access for internal consultancy operations.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="label">Email</span>
            <input type="email" className="field" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input type="password" className="field" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </label>
          <Button type="submit" loading={loading} icon={Lock} className="w-full">Login</Button>
        </form>
      </Card>
    </div>
  );
}
