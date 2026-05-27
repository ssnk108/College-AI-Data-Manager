import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { collegeApi } from "../api/client.js";
import CollegeForm from "../components/CollegeForm.jsx";
import { createEmptyCollege } from "../data/emptyCollege.js";

export default function CollegeFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [college, setCollege] = useState(location.state?.prefill || createEmptyCollege());
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function showFormError(event) {
      toast.error(event.detail);
    }
    window.addEventListener("form-error", showFormError);
    return () => window.removeEventListener("form-error", showFormError);
  }, []);

  useEffect(() => {
    if (mode !== "edit") return;
    collegeApi
      .get(id)
      .then(setCollege)
      .catch((error) => toast.error(error.response?.data?.message || "Unable to load college"))
      .finally(() => setLoading(false));
  }, [id, mode]);

  async function handleSubmit(data) {
    setSaving(true);
    try {
      const saved = mode === "edit" ? await collegeApi.update(id, data) : await collegeApi.create(data);
      toast.success(mode === "edit" ? "College updated" : "College saved");
      navigate(`/colleges/${saved._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="rounded-lg bg-white p-6">Loading college...</p>;

  return <CollegeForm key={college._id || "new"} initialData={college} onSubmit={handleSubmit} submitLabel={mode === "edit" ? "Update College" : "Save College"} loading={saving} />;
}
