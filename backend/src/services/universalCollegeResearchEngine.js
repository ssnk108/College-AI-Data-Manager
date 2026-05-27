import { evaluateExtractionQuality } from "./extractionQualityEngine.js";
import { planMissingFieldResearch } from "./missingFieldResearchPlanner.js";
import { researchCollegeSources } from "./multiSourceResearchService.js";
import { recordResearchPattern, summarizeSourceLearning } from "./sourceLearningEngine.js";

function uniqueByUrl(items = []) {
  const byUrl = new Map();
  items.filter(Boolean).forEach((item) => {
    const key = item.url || JSON.stringify(item);
    if (!byUrl.has(key)) byUrl.set(key, item);
  });
  return [...byUrl.values()];
}

function maxRetriesFor(mode = "quick") {
  if (mode === "deep") return 4;
  if (mode === "standard") return 2;
  return 1;
}

function buildDebug({ researchResult, allSources, allPages, allQueries, attempt, planner, quality }) {
  const readablePages = allPages.filter((page) => page.text);
  const sourceSuccess = uniqueByUrl([
    ...(researchResult.debug?.sourceSuccess || []),
    ...readablePages.map((page) => ({
      source: page.sourceType || "Web Page",
      url: page.url,
      fieldsFilled: [],
      coursesFound: 0,
      feesFound: 0
    }))
  ]);

  return {
    ...(researchResult.debug || {}),
    retryAttempts: attempt,
    searchedQueries: allQueries,
    foundUrls: allSources.map((source) => source.url).filter(Boolean),
    scrapedUrls: readablePages.map((page) => page.url),
    failedUrls: allPages.filter((page) => page.error || !page.text).map((page) => `${page.url}${page.error ? ` (${page.error})` : ""}`),
    scrapedUrlCount: readablePages.length,
    sourceCount: allSources.length,
    brochureCount: allPages.filter((page) => page.isPdf || /\.pdf(?:$|\?)/i.test(page.url || "")).length,
    totalTextLength: readablePages.reduce((sum, page) => sum + (page.text?.length || 0), 0),
    qualityScore: quality?.qualityScore || 0,
    blankFieldsCount: quality?.blankFieldsCount || 0,
    missingFields: quality?.missingFields || [],
    planner,
    sourceSuccess,
    sourceLearningSummary: summarizeSourceLearning({ sourceSuccess })
  };
}

export async function runUniversalCollegeResearch({ input, extractAndNormalize }) {
  const extractionMode = input.extractionMode === "deep" ? "deep" : input.extractionMode === "standard" ? "standard" : "quick";
  const maxRetries = maxRetriesFor(extractionMode);
  let allSources = [];
  let allPages = [];
  let allQueries = [];
  let extraQueries = [];
  let normalized = null;
  let finalResearchResult = null;
  let finalQuality = null;
  let finalPlanner = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const researchMode = extractionMode === "standard" || attempt > 0 ? "deep" : extractionMode;
    const researchResult = await researchCollegeSources({
      ...input,
      extractionMode: researchMode,
      retryAttempt: attempt,
      extraQueries
    });
    finalResearchResult = researchResult;
    allSources = uniqueByUrl([...allSources, ...(researchResult.sources || [])]);
    allPages = uniqueByUrl([...allPages, ...(researchResult.scrapedPages || [])]);
    allQueries = [...new Set([...allQueries, ...(researchResult.queries || []), ...extraQueries])];

    const interimDebug = buildDebug({
      researchResult,
      allSources,
      allPages,
      allQueries,
      attempt,
      planner: finalPlanner,
      quality: finalQuality
    });

    normalized = await extractAndNormalize({
      researchResult,
      allSources,
      allPages,
      debug: interimDebug
    });

    finalQuality = evaluateExtractionQuality(normalized, input);
    finalPlanner = await planMissingFieldResearch({
      college: normalized,
      input,
      mode: extractionMode,
      attempt
    });

    normalized.extractionDebug = buildDebug({
      researchResult,
      allSources,
      allPages,
      allQueries,
      attempt,
      planner: finalPlanner,
      quality: finalQuality
    });

    normalized.extractionDebug.normalizedName = finalResearchResult?.normalized?.normalizedName || "";
    normalized.extractionDebug.possibleNames = finalResearchResult?.normalized?.possibleNames || [];

    if (!finalQuality.shouldDeepen || attempt >= maxRetries || !finalPlanner.newQueries.length) break;
    extraQueries = finalPlanner.newQueries;
    console.log("[Universal research] retry:", attempt + 1, "quality:", finalQuality.qualityScore, "priority:", finalPlanner.retryPriority);
  }

  await recordResearchPattern({
    college: normalized,
    input,
    quality: finalQuality,
    debug: normalized?.extractionDebug || {}
  });

  return {
    college: normalized,
    quality: finalQuality,
    planner: finalPlanner,
    research: {
      normalized: finalResearchResult?.normalized,
      sources: allSources,
      scrapedPages: allPages,
      queries: allQueries
    }
  };
}
