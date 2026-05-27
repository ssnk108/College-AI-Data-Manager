import writeXlsxFile from "write-excel-file";
import { summarizeApprovals, summarizeNaacNirf } from "./utils/summarizeApprovals.js";
import { summarizeCourses } from "./utils/summarizeCourses.js";

export function collegeToRow(college) {
  const basic = college.basicInfo || {};
  const approval = college.affiliationApproval || {};
  const placements = college.placements || {};
  const fees = (college.courses || []).map((c) => c.totalFee).filter(Boolean);
  const courses = summarizeCourses(college.courses || [], 6);
  const approvals = summarizeApprovals(approval, 6);
  const naacNirf = summarizeNaacNirf(approval);

  return {
    "College name": basic.collegeName,
    City: basic.city,
    State: basic.state,
    Ownership: basic.ownershipType,
    "Affiliated university": approval.affiliatedUniversity,
    "Main courses": courses.label,
    "Fees range": fees.length ? `${Math.min(...fees)} - ${Math.max(...fees)}` : "",
    "Approval status": approvals.approvals.join(", "),
    "NAAC/NIRF": naacNirf.join(" | "),
    "Average package": placements.averagePackage,
    "Verification status": college.verificationStatus,
    "Last updated": college.updatedAt ? new Date(college.updatedAt).toLocaleDateString() : ""
  };
}

export async function exportXlsx(colleges) {
  const rows = colleges.map(collegeToRow);
  const headers = Object.keys(rows[0] || collegeToRow({}));
  const data = [
    headers.map((header) => ({ value: header, fontWeight: "bold", backgroundColor: "#e2e8f0" })),
    ...rows.map((row) => headers.map((header) => ({ value: String(row[header] || "") })))
  ];

  await writeXlsxFile(data, {
    fileName: "college-database.xlsx",
    columns: headers.map((header) => ({ width: Math.min(Math.max(header.length + 6, 14), 32) }))
  });
}

export function exportJson(college) {
  const blob = new Blob([JSON.stringify(college, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${college.basicInfo?.collegeName || "college"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
