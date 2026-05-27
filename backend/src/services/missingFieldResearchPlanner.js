import { buildMissingFieldReport, targetedQueriesFromGaps } from "./sourceGapAnalyzer.js";
import { getLearnedSourcePriorities } from "./sourceLearningEngine.js";

const fieldStrategies = {
  courses: {
    suggestedSources: ["official academics page", "departments page", "brochure PDF", "Collegedunia", "Shiksha", "CollegeDekho", "Careers360"],
    queryPatterns: ["{college} all courses", "{college} departments", "{college} academics", "{college} courses and fees", "{college} admission brochure pdf", "{college} prospectus pdf"]
  },
  fees: {
    suggestedSources: ["fee structure PDF", "admission brochure", "Collegedunia", "Shiksha", "CollegeDekho"],
    queryPatterns: ["{college} fee structure pdf", "{college} fees", "{college} courses and fees", "{college} hostel fees", "{college} admission fee"]
  },
  placements: {
    suggestedSources: ["official placement page", "placement report PDF", "NIRF", "Shiksha", "Careers360"],
    queryPatterns: ["{college} placement report pdf", "{college} highest package", "{college} average package", "{college} top recruiters", "{college} placement brochure pdf"]
  },
  approvals: {
    suggestedSources: ["AICTE", "UGC", "NAAC", "NBA", "NIRF", "official accreditation page"],
    queryPatterns: ["{college} AICTE approval", "{college} UGC", "{college} NAAC grade", "{college} NBA accreditation", "{college} NIRF ranking", "{college} accreditation"]
  },
  admission: {
    suggestedSources: ["official admission page", "admission brochure PDF", "prospectus"],
    queryPatterns: ["{college} admission process", "{college} admission brochure pdf", "{college} eligibility", "{college} entrance exam", "{college} admission dates"]
  },
  contact: {
    suggestedSources: ["official contact page", "about page"],
    queryPatterns: ["{college} contact", "{college} address", "{college} official contact", "{college} about"]
  }
};

function classifyGap(gap = {}) {
  const text = `${gap.section} ${gap.field}`.toLowerCase();
  if (/course/.test(text) && /fee/.test(text)) return "fees";
  if (/course/.test(text)) return "courses";
  if (/placement/.test(text)) return "placements";
  if (/approval|accredit|affiliation|university/.test(text)) return "approvals";
  if (/admission/.test(text)) return "admission";
  if (/contact|address|email|phone|website/.test(text)) return "contact";
  return "courses";
}

function fillPattern(pattern, input = {}, college = {}) {
  const name = college.basicInfo?.collegeName || input.collegeName || "";
  return pattern
    .replaceAll("{college}", name)
    .replace(/\s+/g, " ")
    .trim();
}

export async function planMissingFieldResearch({ college = {}, input = {}, mode = "quick", attempt = 0 }) {
  const missingFields = buildMissingFieldReport(college, input);
  const learned = await getLearnedSourcePriorities();
  const retryPriority = [];
  const querySet = new Set(targetedQueriesFromGaps(missingFields));
  const sourceSet = new Set();

  missingFields.forEach((gap) => {
    const group = classifyGap(gap);
    retryPriority.push(group);
    const strategy = fieldStrategies[group] || fieldStrategies.courses;
    strategy.suggestedSources.forEach((source) => sourceSet.add(source));
    strategy.queryPatterns.forEach((pattern) => querySet.add(fillPattern(pattern, input, college)));
    learned
      .filter((source) => (source.bestFor || []).includes(group))
      .slice(0, 5)
      .forEach((source) => {
        sourceSet.add(source.source);
        querySet.add(`site:${source.domain} "${college.basicInfo?.collegeName || input.collegeName}" "${input.state || input.city || ""}"`);
      });
  });

  if (mode === "deep" || attempt > 0) {
    ["brochure pdf", "prospectus pdf", "information brochure pdf", "fee structure pdf", "placement report pdf"].forEach((suffix) => {
      querySet.add(`${college.basicInfo?.collegeName || input.collegeName} ${suffix}`);
    });
  }

  return {
    missingFields,
    newQueries: [...querySet].filter(Boolean).slice(0, mode === "deep" ? 48 : 24),
    suggestedSources: [...sourceSet],
    retryPriority: [...new Set(retryPriority)]
  };
}
