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
  const [duplicateMatch, setDuplicateMatch] = useState(location.state?.prefill?.duplicateMatch || null);
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
      .getAdmin(id)
      .then(setCollege)
      .catch((error) => toast.error(error.response?.data?.message || "Unable to load college"))
      .finally(() => setLoading(false));
  }, [id, mode]);

  async function handleSubmit(data) {
    setSaving(true);
    try {
      const cleanData = stripUiMergeData(data);
      const saved = mode === "edit" ? await collegeApi.update(id, cleanData) : await collegeApi.create(cleanData);
      toast.success(mode === "edit" ? "College updated" : "College saved");
      navigate("/admin/database");
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.duplicateMatch) {
        setDuplicateMatch(error.response.data.duplicateMatch);
        toast.error("Existing college found. Choose merge or create separate entry.");
        return;
      }
      toast.error(error.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateExisting(data) {
    const existingId = duplicateMatch?.existing?._id;
    if (!existingId) return toast.error("Existing college ID missing");
    setSaving(true);
    try {
      const cleanData = stripUiMergeData(data);
      await collegeApi.update(existingId, cleanData);
      toast.success("Existing college updated");
      navigate("/admin/database");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  function handleEditExisting() {
    const existingId = duplicateMatch?.existing?._id;
    if (!existingId) return toast.error("Existing college ID missing");
    navigate(`/admin/colleges/${existingId}/edit`);
  }

  function handleCancelDuplicate() {
    setDuplicateMatch(null);
  }

  async function handleCreateSeparate(data) {
    setSaving(true);
    try {
      const saved = await collegeApi.createSeparate(stripUiMergeData(data));
      toast.success("Separate college entry created");
      navigate("/admin/database");
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="rounded-lg bg-white p-6">Loading college...</p>;

  return (
    <CollegeForm
      key={college._id || "new"}
      initialData={college}
      duplicateMatch={duplicateMatch}
      onSubmit={handleSubmit}
      onUpdateExisting={handleUpdateExisting}
      onCreateSeparate={handleCreateSeparate}
      onEditExisting={handleEditExisting}
      onCancelDuplicate={handleCancelDuplicate}
      submitLabel={mode === "edit" ? "Update College" : "Save College"}
      loading={saving}
    />
  );
}

function stripUiMergeData(data) {
  const clean = { ...data };
  delete clean.duplicateMatch;
  delete clean.forceCreateSeparate;
  return clean;
}
