import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateExtractionQuality, summarizeExtraction } from "../src/services/sourceGapAnalyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportDir = path.resolve(__dirname, "../reports");
const apiBase = process.env.TEST_API_BASE || "http://127.0.0.1:5000/api";

const colleges = [
  { collegeName: "Arka Jain University", city: "Jamshedpur", state: "Jharkhand" },
  { collegeName: "Narula Institute of Technology", city: "Kolkata", state: "West Bengal" },
  { collegeName: "narula institue", city: "Kolkata", state: "West Bengal" },
  { collegeName: "GL Bajaj", city: "Greater Noida", state: "Uttar Pradesh" },
  { collegeName: "Haldia Institute of Technology", city: "Haldia", state: "West Bengal" },
  { collegeName: "D Y Patil", city: "Pune", state: "Maharashtra" },
  { collegeName: "Techno India Salt Lake", city: "Kolkata", state: "West Bengal" },
  { collegeName: "Brainware University", city: "Kolkata", state: "West Bengal" },
  { collegeName: "UEM Kolkata", city: "Kolkata", state: "West Bengal" },
  { collegeName: "Heritage Institute of Technology", city: "Kolkata", state: "West Bengal" },
  { collegeName: "RVS College of Engineering and Technology", city: "Jamshedpur", state: "Jharkhand" },
  { collegeName: "Cambridge Institute of Technology", city: "Ranchi", state: "Jharkhand" },
  { collegeName: "Netaji Subhash Engineering College", city: "Kolkata", state: "West Bengal" },
  { collegeName: "RCC Institute of Information Technology", city: "Kolkata", state: "West Bengal" },
  { collegeName: "Asansol Engineering College", city: "Asansol", state: "West Bengal" },
  { collegeName: "Budge Budge Institute of Technology", city: "Kolkata", state: "West Bengal" },
  { collegeName: "JIS College of Engineering", city: "Kalyani", state: "West Bengal" },
  { collegeName: "Guru Nanak Institute of Technology", city: "Kolkata", state: "West Bengal" },
  { collegeName: "Amity University Jharkhand", city: "Ranchi", state: "Jharkhand" },
  { collegeName: "IES University", city: "Bhopal", state: "Madhya Pradesh" }
];

function htmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function extractCollege(input) {
  const response = await fetch(`${apiBase}/ai/extract-college`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      extractionMode: "deep",
      directAdmissionAvailable: "Not Sure",
      ownershipInput: "Not Sure",
      sourceUrls: []
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  return data;
}

function buildImprovementSuggestions(summary) {
  const suggestions = new Set();
  summary.missingFields.forEach((gap) => {
    if (gap.section === "courses") suggestions.add("Add or prioritize course/fees/brochure queries and inspect table/card parsing.");
    if (gap.section === "placements") suggestions.add("Add placement report/top recruiter/highest package queries and scrape placement PDFs.");
    if (gap.section === "admission") suggestions.add("Search admission brochure and eligibility pages; check hidden admission accordion content.");
    if (gap.section === "affiliationApproval") suggestions.add("Prioritize UGC/AICTE/NAAC/NIRF and official accreditation pages.");
    if (gap.section === "basicInfo") suggestions.add("Prioritize official about/contact pages and improve address/contact extraction.");
  });
  if (summary.sourceLinksFound < 5) suggestions.add("Increase trusted-source search coverage for this college.");
  return [...suggestions];
}

function buildHtml(report) {
  const rows = report.results.map((item) => `
    <tr>
      <td>${htmlEscape(item.input.collegeName)}</td>
      <td>${htmlEscape(item.matchedCollegeName)}</td>
      <td>${item.qualityScore}</td>
      <td>${item.confidenceScore}</td>
      <td>${item.coursesFound}</td>
      <td>${item.feesFound}</td>
      <td>${item.sourceLinksCount}</td>
      <td>${item.scrapedTextLength}</td>
      <td>${htmlEscape(item.improvementSuggestions.join("; "))}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>College Extraction Quality Report</title>
  <style>
    body{font-family:Arial,sans-serif;margin:24px;background:#f8fafc;color:#0f172a}
    table{border-collapse:collapse;width:100%;background:white}
    th,td{border:1px solid #cbd5e1;padding:8px;font-size:13px;vertical-align:top}
    th{background:#0f172a;color:white}
    .bad{color:#b91c1c;font-weight:bold}.good{color:#047857;font-weight:bold}
  </style>
</head>
<body>
  <h1>College Extraction Quality Report</h1>
  <p>Generated: ${htmlEscape(report.generatedAt)}</p>
  <p>Average quality score: <b>${report.averageQualityScore}</b> | Passing colleges: <b>${report.passingCount}/${report.results.length}</b></p>
  <table>
    <thead><tr><th>Input</th><th>Matched</th><th>Quality</th><th>Confidence</th><th>Courses</th><th>Fees</th><th>Sources</th><th>Text</th><th>Suggestions</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

async function main() {
  const limit = Number(process.env.TEST_LIMIT || colleges.length);
  const selected = colleges.slice(0, limit);
  const results = [];

  await fs.mkdir(reportDir, { recursive: true });

  for (const input of selected) {
    const startedAt = Date.now();
    try {
      console.log(`\nTesting: ${input.collegeName}`);
      const college = await extractCollege(input);
      const summary = summarizeExtraction(college, input);
      const qualityScore = calculateExtractionQuality(college);
      const result = {
        input,
        matchedCollegeName: college.basicInfo?.collegeName || "",
        officialWebsite: college.basicInfo?.officialWebsite || "",
        coursesFound: college.courses?.length || 0,
        feesFound: summary.feesFound,
        sourceLinksCount: college.sourceLinks?.length || 0,
        confidenceScore: college.confidenceScore || 0,
        qualityScore,
        missingFields: summary.missingFields,
        failedUrls: college.extractionDebug?.failedUrls || [],
        scrapedTextLength: college.extractionDebug?.totalTextLength || 0,
        retryAttempts: college.extractionDebug?.retryAttempts || 0,
        sourceSuccess: college.extractionDebug?.sourceSuccess || [],
        rawSourceUrls: (college.sourceLinks || []).map((source) => source.url),
        improvementSuggestions: qualityScore < 70 ? buildImprovementSuggestions(summary) : [],
        durationMs: Date.now() - startedAt
      };
      results.push(result);
      console.log(`${result.matchedCollegeName} | quality ${qualityScore} | confidence ${result.confidenceScore} | courses ${result.coursesFound} | sources ${result.sourceLinksCount}`);
    } catch (error) {
      results.push({
        input,
        error: error.message,
        qualityScore: 0,
        improvementSuggestions: ["Extraction request failed; inspect backend logs, search network access, Groq API, and source scraping errors."],
        durationMs: Date.now() - startedAt
      });
      console.error(`Failed: ${error.message}`);
    }
  }

  const averageQualityScore = Math.round(results.reduce((sum, item) => sum + (item.qualityScore || 0), 0) / Math.max(results.length, 1));
  const report = {
    generatedAt: new Date().toISOString(),
    apiBase,
    averageQualityScore,
    passingCount: results.filter((item) => (item.qualityScore || 0) >= 70).length,
    results
  };

  await fs.writeFile(path.join(reportDir, "extraction-quality-report.json"), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(reportDir, "extraction-quality-report.html"), buildHtml(report));

  console.log(`\nReport written to ${path.join(reportDir, "extraction-quality-report.json")}`);
  console.log(`Report written to ${path.join(reportDir, "extraction-quality-report.html")}`);
  console.log(`Average quality score: ${averageQualityScore}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
