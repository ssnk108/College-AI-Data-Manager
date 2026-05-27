import { findCollegeSourceUrls, trustedEducationDomains } from "./collegeSearchService.js";
import { isPdfUrl } from "./pdfResearchService.js";
import { scrapeUrls } from "./scraperService.js";

const priorityOneDomains = ["aicte-india.org", "ugc.gov.in", "naac.gov.in", "nirfindia.org"];
const priorityTwoDomains = ["collegedunia.com", "shiksha.com", "collegedekho.com", "careers360.com", "getmyuni.com"];
const priorityThreeDomains = ["collegebatch.com", "collegevidya.com", "universitykart.com", "campusoption.com", "iirfranking.com", "educationdunia.com", "sikshapedia.com", "embibe.com", "aglasem.com"];

function hostOf(url = "") {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function includesAny(host, domains) {
  return domains.some((domain) => host.includes(domain));
}

export function getSourcePriority(source = {}) {
  const host = hostOf(source.url);
  const label = `${source.sourceType || ""} ${source.title || ""} ${source.url || ""}`.toLowerCase();

  if (/official website|user provided/i.test(source.sourceType || "") || host.endsWith(".ac.in") || host.endsWith(".edu.in") || host.endsWith(".edu")) {
    return { priority: 1, priorityLabel: "Official/Institution" };
  }
  if (includesAny(host, priorityOneDomains) || /aicte|ugc|naac|nirf|nba|approval|accredit/i.test(label)) {
    return { priority: 1, priorityLabel: "Accreditation/Government" };
  }
  if (includesAny(host, priorityTwoDomains)) return { priority: 2, priorityLabel: "High Priority Portal" };
  if (includesAny(host, priorityThreeDomains)) return { priority: 3, priorityLabel: "Education Portal" };
  if (trustedEducationDomains.some((domain) => host.includes(domain))) return { priority: 3, priorityLabel: "Education Portal" };
  return { priority: 4, priorityLabel: "General Web" };
}

export function inferUsedFor(source = {}) {
  const haystack = `${source.title || ""} ${source.url || ""} ${source.usedFor || ""}`.toLowerCase();
  const tags = [];
  if (/course|program|department|specialization|academics/.test(haystack)) tags.push("courses");
  if (/fee|fees|hostel/.test(haystack)) tags.push("fees");
  if (/admission|eligibility|cutoff|exam|brochure/.test(haystack)) tags.push("admission");
  if (/placement|recruiter|package|internship/.test(haystack)) tags.push("placements");
  if (/aicte|ugc|naac|nba|nirf|approval|accredit|rank/.test(haystack)) tags.push("approvals");
  if (/review|rating|student/.test(haystack)) tags.push("reviews");
  if (isPdfUrl(source.url)) tags.push("brochure");
  return tags.length ? tags : ["general"];
}

function decorateSources(sources = []) {
  return sources
    .map((source) => {
      const priority = getSourcePriority(source);
      return {
        ...source,
        ...priority,
        sourceType: source.sourceType || priority.priorityLabel,
        usedFor: Array.isArray(source.usedFor) ? source.usedFor.join(", ") : source.usedFor || inferUsedFor(source).join(", "),
        usedForTags: inferUsedFor(source)
      };
    })
    .sort((a, b) => a.priority - b.priority);
}

function buildSourceSuccess(scrapedPages = []) {
  return scrapedPages.filter((page) => page.text).map((page) => {
    const text = page.text.toLowerCase();
    const fieldsFilled = [];
    if (/course|program|department|b\.?tech|mba|bca|mca|diploma/.test(text)) fieldsFilled.push("courses");
    if (/fee|fees|tuition|hostel/.test(text)) fieldsFilled.push("fees");
    if (/eligibility|admission|entrance|counselling/.test(text)) fieldsFilled.push("admission");
    if (/placement|package|recruiter|internship/.test(text)) fieldsFilled.push("placements");
    if (/aicte|ugc|naac|nba|nirf|approval|accredit/.test(text)) fieldsFilled.push("approvals");
    if (/address|phone|email|contact/.test(text)) fieldsFilled.push("contact");
    const courseMatches = text.match(/\b(b\.?tech|m\.?tech|mba|bba|bca|mca|diploma|b\.?sc|m\.?sc|b\.?com|pharmacy|nursing)\b/g) || [];
    const feeMatches = text.match(/(?:rs\.?|inr|₹)\s?[\d,.]+|[\d,.]+\s?(?:lakh|lakhs|k)\b/g) || [];
    return {
      source: page.sourceType || "Web Page",
      url: page.url,
      fieldsFilled: [...new Set(fieldsFilled)],
      coursesFound: Math.min(courseMatches.length, 50),
      feesFound: Math.min(feeMatches.length, 50)
    };
  });
}

export async function researchCollegeSources(input) {
  const extractionMode = input.extractionMode === "deep" ? "deep" : "quick";
  const searchResult = await findCollegeSourceUrls({ ...input, extractionMode });
  const decoratedSources = decorateSources(searchResult.sources || []);
  const scrapeLimit = extractionMode === "deep" ? 40 : 16;
  const sourcesToScrape = decoratedSources.slice(0, scrapeLimit);
  const scrapedPages = await scrapeUrls(sourcesToScrape, { mode: extractionMode });
  const scrapedUrls = scrapedPages.filter((page) => page.text).map((page) => page.url);
  const failedUrls = scrapedPages.filter((page) => page.error || !page.text).map((page) => `${page.url}${page.error ? ` (${page.error})` : ""}`);
  const totalTextLength = scrapedPages.reduce((sum, page) => sum + (page.text?.length || 0), 0);
  const brochureCount = scrapedPages.filter((page) => page.isPdf || isPdfUrl(page.url)).length;

  const debug = {
    extractionMode,
    normalizedName: searchResult.normalized?.normalizedName || "",
    possibleNames: searchResult.normalized?.possibleNames || [],
    searchedQueries: searchResult.queries || [],
    foundUrls: decoratedSources.map((source) => source.url),
    scrapedUrls,
    failedUrls,
    sourceCount: decoratedSources.length,
    scrapedUrlCount: scrapedUrls.length,
    brochureCount,
    totalTextLength,
    retryAttempts: input.retryAttempt || 0,
    sourceSuccess: buildSourceSuccess(scrapedPages),
    sourcePriority: decoratedSources.map((source) => ({
      title: source.title || source.url,
      url: source.url,
      sourceType: source.sourceType,
      priority: source.priority,
      priorityLabel: source.priorityLabel,
      usedFor: source.usedForTags || inferUsedFor(source)
    }))
  };

  console.log("[AI research] mode:", extractionMode);
  console.log("[AI research] source count:", debug.sourceCount, "scraped:", debug.scrapedUrlCount, "brochures:", debug.brochureCount);

  return {
    normalized: searchResult.normalized,
    queries: searchResult.queries,
    sources: decoratedSources,
    scrapedPages,
    debug
  };
}
