import { calculateExtractionQuality, summarizeExtraction } from "./sourceGapAnalyzer.js";

function sourceReliabilityScore(debug = {}) {
  const sourceSuccess = debug.sourceSuccess || [];
  if (!sourceSuccess.length) return 0;
  const usefulSources = sourceSuccess.filter((source) => (source.fieldsFilled || []).length > 0).length;
  const pdfBoost = (debug.brochureCount || 0) > 0 ? 8 : 0;
  const sourceBoost = Math.min(usefulSources * 2, 12);
  return Math.min(20, sourceBoost + pdfBoost);
}

function courseCompletenessScore(college = {}) {
  const courses = college.courses || [];
  const feeCount = courses.filter((course) => course.annualFee || course.totalFee || course.semesterFee || course.minimumFee || course.maximumFee).length;
  const sourceCount = courses.filter((course) => course.courseSource || course.feeSource || course.eligibilitySource).length;
  return Math.min(20, Math.min(courses.length, 12) + Math.min(feeCount, 5) + Math.min(sourceCount, 3));
}

export function evaluateExtractionQuality(college = {}, input = {}) {
  const summary = summarizeExtraction(college, input);
  const baseScore = calculateExtractionQuality(college);
  const reliability = sourceReliabilityScore(college.extractionDebug || {});
  const courseCompleteness = courseCompletenessScore(college);
  const validationQuality = Math.min((college.sourceLinks || []).length, 10);
  const finalScore = Math.min(100, Math.max(baseScore, Math.round(baseScore * 0.78 + reliability + courseCompleteness * 0.35 + validationQuality * 0.4)));

  return {
    ...summary,
    qualityScore: finalScore,
    baseQualityScore: baseScore,
    sourceReliabilityScore: reliability,
    courseCompletenessScore: courseCompleteness,
    validationQualityScore: validationQuality,
    shouldDeepen: finalScore < 70 || summary.coursesFound < 8 || summary.feesFound < 3
  };
}
