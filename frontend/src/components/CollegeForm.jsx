import { Plus, Save, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { ConfidenceBadge, VerificationBadge } from "./Badges.jsx";
import { Section, SelectInput, TextArea, TextInput } from "./FormControls.jsx";
import { Button, Modal } from "./ui.jsx";
import { emptyCourse, emptySourceLink, facilityOptions, ownershipOptions, warningOptions } from "../data/emptyCollege.js";

const tabs = ["Basic", "Approval", "Courses", "Admission", "Placements", "Review", "Warnings", "Sources"];

function setNested(data, section, field, value) {
  return { ...data, [section]: { ...data[section], [field]: value } };
}

function isValidUrl(value) {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export default function CollegeForm({ initialData, duplicateMatch, onSubmit, onUpdateExisting, onCreateSeparate, onEditExisting, onCancelDuplicate, submitLabel = "Save College", loading = false }) {
  const [college, setCollege] = useState(initialData);
  const [activeTab, setActiveTab] = useState("Basic");

  const fieldWarning = useMemo(() => new Set(college.fieldsNeedingVerification || []), [college.fieldsNeedingVerification]);
  const isAdmin = Boolean(localStorage.getItem("adminToken"));
  const debug = college.extractionDebug || null;

  function update(section, field, value) {
    setCollege((current) => setNested(current, section, field, value));
  }

  function updateCourse(index, field, value) {
    setCollege((current) => ({
      ...current,
      courses: current.courses.map((course, i) => (i === index ? { ...course, [field]: value } : course))
    }));
  }

  function updateCourseNested(index, group, field, value) {
    setCollege((current) => ({
      ...current,
      courses: current.courses.map((course, i) =>
        i === index ? { ...course, [group]: { ...(course[group] || {}), [field]: value } } : course
      )
    }));
  }

  function validate() {
    if (!college.basicInfo.collegeName.trim()) return "College name is required";
    if (!college.basicInfo.state.trim()) return "State is required";
    if (college.basicInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(college.basicInfo.email)) return "Enter a valid email";
    if (!isValidUrl(college.basicInfo.officialWebsite)) return "Website must include http:// or https://";
    const badSource = (college.sourceLinks || []).find((item) => item.url && !isValidUrl(item.url));
    if (badSource) return "Source URLs must include http:// or https://";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const error = validate();
    if (error) {
      window.dispatchEvent(new CustomEvent("form-error", { detail: error }));
      return;
    }
    await onSubmit(college);
  }

  const basic = college.basicInfo;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4">
        <div>
          <h1 className="text-2xl font-bold">{basic.collegeName || "New College"}</h1>
          <p className="text-sm text-slate-600">{basic.city || "City"}{basic.state ? `, ${basic.state}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <VerificationBadge status={college.verificationStatus} />
          <ConfidenceBadge score={college.confidenceScore} />
        </div>
      </div>
        {duplicateMatch && (
          <Modal
            open
            title="Possible Duplicate College Found"
            tone="amber"
            onClose={onCancelDuplicate}
            footer={
              <>
                <Button variant="secondary" type="button" onClick={onEditExisting}>Edit Existing</Button>
                <Button variant="primary" type="button" onClick={() => onUpdateExisting?.(college)}>Update Existing</Button>
                <Button variant="ghost" type="button" onClick={() => onCreateSeparate?.(college)}>Add Anyway</Button>
                <Button variant="secondary" type="button" onClick={onCancelDuplicate}>Cancel</Button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-bold text-amber-950">A possible duplicate was detected.</p>
                <p className="mt-2 text-sm text-amber-900">Review the existing college record before creating a new entry.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase text-slate-500">Existing college</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{duplicateMatch.existing?.collegeName || duplicateMatch.existing?.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{duplicateMatch.existing?.city || "City not added"}{duplicateMatch.existing?.state ? `, ${duplicateMatch.existing?.state}` : ""}</p>
                  <p className="mt-2 text-sm text-slate-600">Website: {duplicateMatch.existing?.website || "-"}</p>
                  <p className="mt-1 text-sm text-slate-600">Email: {duplicateMatch.existing?.email || "-"}</p>
                  <p className="mt-1 text-sm text-slate-600">Phone: {duplicateMatch.existing?.phone || "-"}</p>
                  <p className="mt-2 text-sm text-slate-600">Verification: {duplicateMatch.existing?.verificationStatus || "Unknown"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase text-slate-500">Match reasons</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-700">
                    {duplicateMatch.existing?.matchReasons?.length ? duplicateMatch.existing.matchReasons.map((reason, index) => (
                      <p key={index} className="rounded-lg bg-slate-50 p-2 text-sm">{reason}</p>
                    )) : <p className="text-slate-500">No specific match reasons available.</p>}
                  </div>
                  {duplicateMatch.matches?.length > 1 && (
                    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                      <p className="font-semibold">Other possible duplicates</p>
                      <ul className="mt-2 space-y-2">
                        {duplicateMatch.matches.slice(1, 4).map((match) => (
                          <li key={match._id} className="rounded-md bg-white p-2 shadow-sm">
                            <p className="font-semibold">{match.name}</p>
                            <p className="text-xs text-slate-500">{match.city || "-"}, {match.state || "-"}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
      {debug && (
        <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-950">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <span><b>Mode:</b> {debug.extractionMode || "quick"}</span>
            <span><b>Sources:</b> {debug.sourceCount || 0}</span>
            <span><b>Pages scraped:</b> {debug.scrapedUrlCount || 0}</span>
            <span><b>Brochures:</b> {debug.brochureCount || 0}</span>
            <span><b>Courses:</b> {college.courses?.length || 0}</span>
          </div>
        </div>
      )}

      <div className="no-print flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === tab ? "bg-ocean text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Basic" && (
        <Section title="A. Basic Information">
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput label="College name" required value={basic.collegeName} onChange={(v) => update("basicInfo", "collegeName", v)} />
            <TextInput label="Short name" value={basic.shortName} onChange={(v) => update("basicInfo", "shortName", v)} />
            <TextInput label="Establishment year" value={basic.establishmentYear} onChange={(v) => update("basicInfo", "establishmentYear", v)} />
            <SelectInput label="Ownership type" value={basic.ownershipType} onChange={(v) => update("basicInfo", "ownershipType", v)} options={ownershipOptions} />
            <TextInput label="College type" value={basic.collegeType} onChange={(v) => update("basicInfo", "collegeType", v)} />
            <TextInput label="Gender type" value={basic.genderType} onChange={(v) => update("basicInfo", "genderType", v)} />
            <TextInput label="Campus area" value={basic.campusArea} onChange={(v) => update("basicInfo", "campusArea", v)} />
            <TextInput label="City" value={basic.city} onChange={(v) => update("basicInfo", "city", v)} />
            <TextInput label="District" value={basic.district} onChange={(v) => update("basicInfo", "district", v)} />
            <TextInput label="State" required value={basic.state} onChange={(v) => update("basicInfo", "state", v)} />
            <TextInput label="PIN code" value={basic.pinCode} onChange={(v) => update("basicInfo", "pinCode", v)} />
            <TextInput label="Official website" value={basic.officialWebsite} onChange={(v) => update("basicInfo", "officialWebsite", v)} />
            <TextInput label="Contact number" value={basic.contactNumber} onChange={(v) => update("basicInfo", "contactNumber", v)} />
            <TextInput label="Email" value={basic.email} onChange={(v) => update("basicInfo", "email", v)} />
          </div>
          <div className="mt-4">
            <TextArea label="Address" value={basic.address} onChange={(v) => update("basicInfo", "address", v)} />
          </div>
          {fieldWarning.size > 0 && <p className="mt-3 text-sm text-amber">Some fields are marked as needing verification.</p>}
        </Section>
      )}

      {activeTab === "Approval" && (
        <Section title="B. Affiliation & Approval">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(college.affiliationApproval).map(([key, value]) => (
              <TextInput key={key} label={key.replace(/([A-Z])/g, " $1")} value={value} onChange={(v) => update("affiliationApproval", key, v)} />
            ))}
          </div>
        </Section>
      )}

      {activeTab === "Courses" && (
        <Section title="C. Courses">
          <div className="space-y-4">
            {college.courses.map((course, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Course {index + 1}</h3>
                  <button type="button" onClick={() => setCollege((c) => ({ ...c, courses: c.courses.filter((_, i) => i !== index) }))} className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-sm text-rose-700">
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    "courseName",
                    "degreeType",
                    "stream",
                    "duration",
                    "eligibility",
                    "entranceExam",
                    "annualFee",
                    "totalFee",
                    "semesterFee",
                    "minimumFee",
                    "maximumFee",
                    "hostelFee",
                    "admissionFee",
                    "cautionMoney",
                    "seatIntake",
                    "mode",
                    "admissionType",
                    "courseSource",
                    "feeSource",
                    "eligibilitySource"
                  ].map((key) => (
                    <TextInput
                      key={key}
                      type={["annualFee", "totalFee", "seatIntake"].includes(key) ? "number" : "text"}
                      label={key.replace(/([A-Z])/g, " $1")}
                      value={course[key] ?? ""}
                      onChange={(v) => updateCourse(index, key, ["annualFee", "totalFee", "seatIntake"].includes(key) ? (v === "" ? null : Number(v)) : v)}
                    />
                  ))}
                </div>
                <CourseCommercialFields
                  course={course}
                  showIncentiveDefault={college.directAdmissionAvailable === "Yes" && college.ownershipInput !== "Government"}
                  showDonationDefault={college.ownershipInput === "Government" || college.directAdmissionAvailable === "No"}
                  onNestedChange={(group, field, value) => updateCourseNested(index, group, field, value)}
                />
              </div>
            ))}
            <button type="button" onClick={() => setCollege((c) => ({ ...c, courses: [...c.courses, emptyCourse()] }))} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              <Plus size={16} /> Add Course
            </button>
          </div>
        </Section>
      )}

      {activeTab === "Admission" && (
        <Section title="D. Admission Details">
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <SelectInput label="Direct admission available" value={college.directAdmissionAvailable || ""} onChange={(v) => setCollege((c) => ({ ...c, directAdmissionAvailable: v }))} options={["Yes", "No", "Not Sure"]} />
            <SelectInput label="Ownership input" value={college.ownershipInput || ""} onChange={(v) => setCollege((c) => ({ ...c, ownershipInput: v }))} options={["Government", "Private", "Semi-Government", "Not Sure"]} />
            <TextInput label="Admission note" value={college.admissionNote || ""} onChange={(v) => setCollege((c) => ({ ...c, admissionNote: v }))} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(college.admission).map(([key, value]) => (
              <TextArea key={key} label={key.replace(/([A-Z])/g, " $1")} value={value} onChange={(v) => update("admission", key, v)} />
            ))}
          </div>
        </Section>
      )}

      {activeTab === "Placements" && (
        <Section title="E. Placement Details and F. Facilities">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(college.placements).map(([key, value]) => (
              <TextInput key={key} label={key.replace(/([A-Z])/g, " $1")} value={value} onChange={(v) => update("placements", key, v)} />
            ))}
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {facilityOptions.map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-md border bg-slate-50 p-2 text-sm">
                <input type="checkbox" checked={college.facilities.includes(item)} onChange={(e) => setCollege((c) => ({ ...c, facilities: e.target.checked ? [...c.facilities, item] : c.facilities.filter((x) => x !== item) }))} />
                {item}
              </label>
            ))}
          </div>
        </Section>
      )}

      {activeTab === "Review" && (
        <Section title="G. Review & Recommendation">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(college.reviewRecommendation).map(([key, value]) => (
              <TextArea key={key} label={key.replace(/([A-Z])/g, " $1")} value={value} onChange={(v) => update("reviewRecommendation", key, v)} rows={2} />
            ))}
          </div>
        </Section>
      )}

      {activeTab === "Warnings" && (
        <Section title="H. Warnings and Verification">
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {warningOptions.map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-md border bg-slate-50 p-2 text-sm">
                <input type="checkbox" checked={college.warnings.includes(item)} onChange={(e) => setCollege((c) => ({ ...c, warnings: e.target.checked ? [...c.warnings, item] : c.warnings.filter((x) => x !== item) }))} />
                {item}
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <SelectInput label="Verification status" value={college.verificationStatus} onChange={(v) => setCollege((c) => ({ ...c, verificationStatus: v }))} options={["Verified", "Partially Verified", "Low Confidence", "Needs Verification"]} />
            <TextInput label="Confidence score" type="number" value={college.confidenceScore} onChange={(v) => setCollege((c) => ({ ...c, confidenceScore: Number(v) }))} />
            <TextInput label="Fields needing verification" value={(college.fieldsNeedingVerification || []).join(", ")} onChange={(v) => setCollege((c) => ({ ...c, fieldsNeedingVerification: v.split(",").map((x) => x.trim()).filter(Boolean) }))} />
          </div>
          <div className="mt-4">
            <TextArea label="Custom warning notes" value={college.warningNotes} onChange={(v) => setCollege((c) => ({ ...c, warningNotes: v }))} />
          </div>
        </Section>
      )}

      {activeTab === "Sources" && (
        <Section title="I. Source Links">
          {college.fieldsNeedingVerification?.length > 0 && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Fields needing verification</p>
              <p className="mt-1">{college.fieldsNeedingVerification.join(", ")}</p>
            </div>
          )}
          <div className="space-y-4">
            {college.sourceLinks.map((source, index) => (
              <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-5">
                {Object.entries(source).map(([key, value]) => (
                  <TextInput key={key} label={key.replace(/([A-Z])/g, " $1")} value={value} onChange={(v) => setCollege((c) => ({ ...c, sourceLinks: c.sourceLinks.map((item, i) => (i === index ? { ...item, [key]: v } : item)) }))} />
                ))}
                <button type="button" onClick={() => setCollege((c) => ({ ...c, sourceLinks: c.sourceLinks.filter((_, i) => i !== index) }))} className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md bg-rose-50 px-3 text-sm text-rose-700">
                  <Trash2 size={15} /> Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setCollege((c) => ({ ...c, sourceLinks: [...c.sourceLinks, emptySourceLink()] }))} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              <Plus size={16} /> Add Source
            </button>
          </div>
          {debug && isAdmin && (
            <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm">
              <p className="font-semibold text-orange-900">Extraction Debug - ADMIN ONLY</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <DebugList title="Searched queries" items={debug.searchedQueries} />
                <DebugList title="Found URLs" items={debug.foundUrls} />
                <DebugList title="Scraped URLs" items={debug.scrapedUrls} />
                <DebugList title="Failed URLs" items={debug.failedUrls} />
              </div>
              <p className="mt-3 text-orange-900">Readable text: {debug.totalTextLength || 0} characters</p>
            </div>
          )}
        </Section>
      )}

      <div className="no-print sticky bottom-4 flex justify-end">
        <button disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-ocean px-5 py-3 font-semibold text-white shadow-lg disabled:opacity-60">
          <Save size={18} /> {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function DebugList({ title, items = [] }) {
  return (
    <div>
      <p className="font-medium text-slate-900">{title}</p>
      <div className="mt-1 max-h-44 overflow-auto rounded-md border bg-white p-2 text-xs text-slate-700">
        {items.length ? items.slice(0, 80).map((item, index) => <p key={`${item}-${index}`} className="break-all">{item}</p>) : <p className="text-slate-400">None</p>}
      </div>
    </div>
  );
}

function CourseCommercialFields({ course, showIncentiveDefault, showDonationDefault, onNestedChange }) {
  const incentive = course.incentive || {};
  const donation = course.donation || {};
  const showIncentive = showIncentiveDefault || incentive.incentiveAvailable;
  const showDonation = showDonationDefault || donation.donationApplicable;

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={Boolean(incentive.incentiveAvailable)} onChange={(event) => onNestedChange("incentive", "incentiveAvailable", event.target.checked)} />
          Incentive available
        </label>
        {showIncentive && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <TextInput label="Incentive amount" value={incentive.incentiveAmount || ""} onChange={(v) => onNestedChange("incentive", "incentiveAmount", v)} />
            <SelectInput label="Incentive type" value={incentive.incentiveType || ""} onChange={(v) => onNestedChange("incentive", "incentiveType", v)} options={["Fixed", "Percentage", "Other"]} />
            <div className="md:col-span-2">
              <TextArea label="Incentive notes" value={incentive.incentiveNotes || ""} onChange={(v) => onNestedChange("incentive", "incentiveNotes", v)} rows={2} />
            </div>
          </div>
        )}
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={Boolean(donation.donationApplicable)} onChange={(event) => onNestedChange("donation", "donationApplicable", event.target.checked)} />
          Donation applicable
        </label>
        {showDonation && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <TextInput label="Donation amount" value={donation.donationAmount || ""} onChange={(v) => onNestedChange("donation", "donationAmount", v)} />
            <TextArea label="Donation notes" value={donation.donationNotes || ""} onChange={(v) => onNestedChange("donation", "donationNotes", v)} rows={2} />
          </div>
        )}
      </div>
    </div>
  );
}
