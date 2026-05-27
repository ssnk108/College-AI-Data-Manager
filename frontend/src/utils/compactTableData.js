import { summarizeApprovals, summarizeNaacNirf } from "./summarizeApprovals.js";
import { summarizeCourses } from "./summarizeCourses.js";

function compactPackage(value = "", suffix = "") {
  const text = String(value || "");
  if (!text) return "";
  const amount = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac|lacs?|k|crore|cr)?/i);
  if (!amount) return text.replace(/\s+/g, " ").slice(0, 18);
  const unit = /crore|cr/i.test(text) ? "Cr" : /k\b/i.test(text) ? "K" : "LPA";
  return `₹${amount[1]} ${unit}${suffix ? ` ${suffix}` : ""}`;
}

export function summarizeFacilities(facilities = [], maxVisible = 3) {
  const clean = [...new Set((facilities || []).filter(Boolean))];
  return {
    visible: clean.slice(0, maxVisible),
    hiddenCount: Math.max(clean.length - maxVisible, 0),
    all: clean
  };
}

export function summarizePlacement(placements = {}) {
  const high = compactPackage(placements.highestPackage, "High");
  const avg = compactPackage(placements.averagePackage, "Avg");
  return [high, avg].filter(Boolean);
}

export function compactCollegeTableData(college = {}) {
  const basic = college.basicInfo || {};
  const approval = college.affiliationApproval || {};
  const courses = summarizeCourses(college.courses || []);
  const approvals = summarizeApprovals(approval);
  const naacNirf = summarizeNaacNirf(approval);
  const facilities = summarizeFacilities(college.facilities || []);
  const placement = summarizePlacement(college.placements || {});
  const fees = (college.courses || []).map((course) => course.totalFee || course.annualFee).filter(Boolean);

  return {
    name: basic.collegeName || "",
    city: basic.city || "",
    state: basic.state || "",
    ownership: basic.ownershipType || "",
    affiliatedUniversity: approval.affiliatedUniversity || "",
    courses,
    feesRange: fees.length ? `${Math.min(...fees)} - ${Math.max(...fees)}` : "",
    approvals,
    naacNirf,
    placement,
    facilities,
    verificationStatus: college.verificationStatus || "",
    lastUpdated: college.updatedAt ? new Date(college.updatedAt).toLocaleDateString() : ""
  };
}
