import React from "react";
import { VerificationBadge } from "./Badges.jsx";

function useful(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value === null || value === undefined ? "" : String(value).trim();
}

function missingFields(college) {
  const basic = college.basicInfo || {};
  const approval = college.affiliationApproval || {};
  const placements = college.placements || {};
  const admission = college.admission || {};
  return [
    !useful(basic.address) && "Address",
    !useful(basic.officialWebsite) && "Official website",
    !useful(approval.affiliatedUniversity) && "Affiliation",
    !useful(approval.aicteApproval) && "AICTE approval",
    !(college.courses || []).length && "Courses",
    !useful(admission.admissionProcess) && "Admission process",
    !useful(placements.averagePackage) && "Average package"
  ].filter(Boolean);
}

export default function A4Report({ college }) {
  const basic = college.basicInfo || {};
  const approval = college.affiliationApproval || {};
  const placements = college.placements || {};
  const admission = college.admission || {};
  const missing = missingFields(college);

  return (
    <article className="a4-report mx-auto bg-white p-8 shadow-xl" style={{ width: "210mm", minHeight: "297mm" }}>
      <div className="flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{basic.collegeName}</h1>
          {useful(basic.address) && <p className="text-sm text-slate-600">{basic.address}</p>}
          {useful(basic.officialWebsite) && <p className="text-xs text-slate-500">{basic.officialWebsite}</p>}
        </div>
        <VerificationBadge status={college.verificationStatus} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <Info label="Ownership" value={basic.ownershipType} />
        <Info label="Affiliation" value={approval.affiliatedUniversity} />
        <Info label="NAAC / NIRF" value={[approval.naacGrade, approval.nirfRanking].filter(Boolean).join(" / ")} />
      </div>

      <Section title="Approvals">
        <List items={[approval.ugcApproval, approval.aicteApproval, approval.nbaAccreditation, approval.pciApproval, approval.bciApproval, approval.ncteApproval, approval.incApproval, approval.otherApprovals]} />
      </Section>

      {(college.courses || []).length > 0 && (
        <Section title="Courses and Fees">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b"><th>Course</th><th>Duration</th><th>Eligibility</th><th>Total Fee</th></tr></thead>
            <tbody>
              {(college.courses || []).slice(0, 8).map((course, index) => (
                <tr key={index} className="border-b"><td>{course.courseName}</td><td>{course.duration}</td><td>{course.eligibility}</td><td>{course.totalFee ? `Rs. ${course.totalFee}` : ""}</td></tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Section title="Admission">
          {useful(admission.admissionProcess) && <p className="text-xs leading-5">{admission.admissionProcess}</p>}
          {useful(admission.entranceExams) && <p className="mt-1 text-xs"><b>Exams:</b> {admission.entranceExams}</p>}
          {useful(college.admissionNote) && <p className="mt-1 text-xs"><b>Note:</b> {college.admissionNote}</p>}
        </Section>
        <Section title="Placement">
          {useful(placements.highestPackage) && <p className="text-xs"><b>Highest:</b> {placements.highestPackage}</p>}
          {useful(placements.averagePackage) && <p className="text-xs"><b>Average:</b> {placements.averagePackage}</p>}
          {useful(placements.topRecruiters) && <p className="text-xs"><b>Recruiters:</b> {placements.topRecruiters}</p>}
        </Section>
      </div>

      <Section title="Facilities">
        <List items={college.facilities} />
      </Section>

      <div className="grid grid-cols-2 gap-4">
        <Section title="Recommendation">
          {useful(college.reviewRecommendation?.overallRecommendation) && <p className="text-xs leading-5">{college.reviewRecommendation.overallRecommendation}</p>}
        </Section>
        <Section title="Warnings">
          <List items={college.warnings} />
          {useful(college.warningNotes) && <p className="mt-1 text-xs">{college.warningNotes}</p>}
        </Section>
      </div>

      {missing.length > 0 && (
        <Section title="Missing / Not Verified Information">
          <p className="text-xs leading-5">{missing.join(", ")}</p>
        </Section>
      )}

      <Section title="Source Links">
        {(college.sourceLinks || []).map((source, index) => (
          <p key={index} className="break-all text-[10px] leading-4">{source.title || source.sourceType}: {source.url}</p>
        ))}
      </Section>
    </article>
  );
}

function List({ items }) {
  const filtered = (items || []).filter(Boolean);
  if (!filtered.length) return null;
  return <p className="text-xs leading-5">{filtered.join(", ")}</p>;
}

function Info({ label, value }) {
  if (!useful(value)) return null;
  return <div className="rounded-md bg-slate-100 p-2"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="text-xs font-semibold">{value}</p></div>;
}

function Section({ title, children }) {
  return <section className="mt-4"><h2 className="mb-1 border-b text-sm font-bold">{title}</h2>{children}</section>;
}

