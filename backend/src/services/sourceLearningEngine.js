import mongoose from "mongoose";
import ResearchPattern from "../models/ResearchPattern.js";

const defaultSourceKnowledge = [
  { source: "official website", domain: "", bestFor: ["contact", "courses", "admission", "approvals"], successRate: 95 },
  { source: "AICTE", domain: "aicte-india.org", bestFor: ["approvals"], successRate: 90 },
  { source: "UGC", domain: "ugc.gov.in", bestFor: ["approvals"], successRate: 90 },
  { source: "NAAC", domain: "naac.gov.in", bestFor: ["approvals"], successRate: 88 },
  { source: "NIRF", domain: "nirfindia.org", bestFor: ["rankings", "placements"], successRate: 82 },
  { source: "Collegedunia", domain: "collegedunia.com", bestFor: ["courses", "fees", "admission", "placements"], successRate: 86 },
  { source: "Shiksha", domain: "shiksha.com", bestFor: ["courses", "fees", "placements", "reviews"], successRate: 84 },
  { source: "CollegeDekho", domain: "collegedekho.com", bestFor: ["courses", "fees", "admission"], successRate: 80 },
  { source: "Careers360", domain: "careers360.com", bestFor: ["courses", "fees", "placements", "rankings"], successRate: 78 },
  { source: "GetMyUni", domain: "getmyuni.com", bestFor: ["courses", "fees", "reviews"], successRate: 74 },
  { source: "CollegeBatch", domain: "collegebatch.com", bestFor: ["courses", "fees", "reviews"], successRate: 70 }
];

function domainOf(url = "") {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export async function getLearnedSourcePriorities() {
  if (mongoose.connection.readyState !== 1) return defaultSourceKnowledge;
  const learned = await ResearchPattern.aggregate([
    { $match: { domain: { $ne: "" } } },
    {
      $group: {
        _id: { domain: "$domain", fieldGroup: "$fieldGroup" },
        successCount: { $sum: "$successCount" },
        failureCount: { $sum: "$failureCount" },
        qualityScore: { $avg: "$qualityScore" }
      }
    },
    { $sort: { qualityScore: -1, successCount: -1 } },
    { $limit: 50 }
  ]);

  const dynamic = learned.map((item) => ({
    source: item._id.domain,
    domain: item._id.domain,
    bestFor: [item._id.fieldGroup],
    successRate: Math.round((item.successCount / Math.max(item.successCount + item.failureCount, 1)) * 100)
  }));

  return [...dynamic, ...defaultSourceKnowledge];
}

export async function recordResearchPattern({ college = {}, input = {}, quality = {}, debug = {} }) {
  if (mongoose.connection.readyState !== 1) return;
  const sourceSuccess = debug.sourceSuccess || [];
  if (!sourceSuccess.length) return;

  await ResearchPattern.insertMany(
    sourceSuccess.slice(0, 80).flatMap((source) => {
      const domain = domainOf(source.url);
      const fields = source.fieldsFilled?.length ? source.fieldsFilled : ["general"];
      return fields.map((fieldGroup) => ({
        domain,
        query: (debug.searchedQueries || [])[0] || "",
        collegeType: college.basicInfo?.collegeType || "",
        fieldGroup,
        fieldsFilled: source.fieldsFilled || [],
        coursesFound: source.coursesFound || 0,
        feesFound: source.feesFound || 0,
        qualityScore: quality.qualityScore || 0,
        successCount: (source.fieldsFilled || []).length > 0 ? 1 : 0,
        failureCount: (source.fieldsFilled || []).length > 0 ? 0 : 1,
        lastUsedAt: new Date()
      }));
    }),
    { ordered: false }
  ).catch(() => {});
}

export function summarizeSourceLearning(debug = {}) {
  const bySource = new Map();
  (debug.sourceSuccess || []).forEach((source) => {
    const domain = domainOf(source.url) || source.source || "unknown";
    const existing = bySource.get(domain) || { source: source.source, domain, fieldsFilled: new Set(), coursesFound: 0, feesFound: 0 };
    (source.fieldsFilled || []).forEach((field) => existing.fieldsFilled.add(field));
    existing.coursesFound += source.coursesFound || 0;
    existing.feesFound += source.feesFound || 0;
    bySource.set(domain, existing);
  });

  return [...bySource.values()].map((item) => ({
    ...item,
    fieldsFilled: [...item.fieldsFilled]
  }));
}
