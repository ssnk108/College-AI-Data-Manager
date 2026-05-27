import axios from "axios";
import * as cheerio from "cheerio";
import { normalizeCollegeName } from "../utils/normalizeCollegeName.js";

const SEARCH_TIMEOUT_MS = 12000;
const SEARCH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export const trustedEducationDomains = [
  "collegedunia.com",
  "shiksha.com",
  "collegedekho.com",
  "careers360.com",
  "getmyuni.com",
  "collegebatch.com",
  "collegevidya.com",
  "universitykart.com",
  "iirfranking.com",
  "educationdunia.com",
  "sikshapedia.com",
  "embibe.com",
  "campusoption.com",
  "aglasem.com"
];

const preferredHostParts = ["aicte-india.org", "ugc.gov.in", "nirfindia.org", "naac.gov.in", ...trustedEducationDomains];
const blockedHostParts = [
  "facebook.",
  "instagram.",
  "linkedin.",
  "youtube.",
  "twitter.",
  "x.com",
  "wikipedia.",
  "justdial.",
  "mapcarta.",
  "zollege.",
  "quora.",
  "reddit."
];

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export function buildSearchQueries({ collegeName, city, state }) {
  const normalized = normalizeCollegeName(collegeName);
  const names = [...new Set(normalized.possibleNames)];
  const queryTemplates = [
    "{name} official website",
    "{name} {state} official website",
    "{name} {city} official website",
    "{name} collegedunia",
    "{name} shiksha",
    "{name} collegedekho",
    "{name} collegebatch",
    "{name} collegevidya",
    "{name} careers360",
    "{name} getmyuni",
    "{name} universitykart",
    "{name} courses fees",
    "{name} all courses",
    "{name} specializations",
    "{name} admission brochure pdf",
    "{name} fee structure pdf",
    "{name} departments",
    "{name} placements",
    "{name} placement report",
    "{name} hostel fees",
    "{name} reviews",
    "{name} ranking",
    "{name} contact",
    "{name} affiliation",
    "{name} AICTE approval",
    "{name} NAAC",
    "{name} NBA accreditation",
    "{name} NIRF",
    "{name} admission process",
    "{name} seat intake",
    "{name} eligibility",
    "{name} scholarship",
    "{name} hostel facilities",
    "{name} brochure pdf"
  ];

  const queries = [];
  names.forEach((name) => {
    queryTemplates.forEach((template) => {
      queries.push(template.replace("{name}", name).replace("{city}", city || "").replace("{state}", state || "").replace(/\s+/g, " ").trim());
    });
  });

  return [...new Set(queries)].slice(0, 80);
}

async function searchDuckDuckGo(query) {
  const response = await axios.get("https://html.duckduckgo.com/html/", {
    params: { q: query },
    timeout: SEARCH_TIMEOUT_MS,
    headers: { "User-Agent": SEARCH_USER_AGENT }
  });
  const $ = cheerio.load(response.data);
  const results = [];

  $("a.result__a, .result a").each((_, element) => {
    let href = $(element).attr("href") || "";
    if (href.startsWith("//duckduckgo.com/l/?")) href = new URL(`https:${href}`).searchParams.get("uddg") || "";
    if (href.startsWith("/l/?")) href = new URL(`https://duckduckgo.com${href}`).searchParams.get("uddg") || "";
    const url = normalizeUrl(href);
    if (!url) return;
    results.push({
      title: $(element).text().replace(/\s+/g, " ").trim() || url,
      url,
      sourceType: "Search Result",
      usedFor: query
    });
  });

  return results;
}

function collegeAcronyms(collegeName) {
  const { normalizedName, possibleNames } = normalizeCollegeName(collegeName);
  const values = new Set();
  [...possibleNames, normalizedName].forEach((name) => {
    const words = name
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word && !["of", "the", "and", "for"].includes(word));
    values.add(words.map((word) => word[0]).join(""));
    values.add(words.join(""));
    values.add(words.join("-"));
  });
  if (normalizedName.includes("narula")) values.add("nit");
  if (normalizedName.includes("haldia")) values.add("hit");
  if (normalizedName.includes("heritage")) values.add("heritageit");
  if (normalizedName.includes("gl bajaj")) values.add("glbitm");
  if (normalizedName.includes("brainware")) values.add("brainwareuniversity");
  if (normalizedName.includes("arka jain")) values.add("arkajainuniversity");
  return [...values].filter((value) => value.length >= 3);
}

function tokenScore(text, { collegeName, city, state }) {
  const { normalizedName, possibleNames } = normalizeCollegeName(collegeName);
  const haystack = text.toLowerCase();
  const allNames = [normalizedName, ...possibleNames].map((name) => name.toLowerCase());
  const exactHit = allNames.some((name) => name && haystack.includes(name));
  const tokens = normalizedName.split(/\W+/).filter((token) => token.length > 2);
  const distinctive = tokens.filter((token) => !["institute", "technology", "college", "university", "engineering", "management"].includes(token));
  const tokenHits = tokens.filter((token) => haystack.includes(token)).length;
  const distinctiveHit = distinctive.some((token) => haystack.includes(token));
  const locationHits = [city, state].filter(Boolean).filter((part) => haystack.includes(part.toLowerCase())).length;
  if (!exactHit && !distinctiveHit) return 0;
  return (exactHit ? 15 : 0) + (distinctiveHit ? 10 : 0) + tokenHits * 3 + locationHits * 3;
}

function hostScore(source, input) {
  try {
    const host = new URL(source.url).hostname.replace(/^www\./, "").toLowerCase();
    if (blockedHostParts.some((part) => host.includes(part))) return -100;
    let score = tokenScore(`${source.title} ${host} ${source.url}`, input);
    if (preferredHostParts.some((part) => host.includes(part))) score += 20;
    if (trustedEducationDomains.some((part) => host.includes(part))) score += 14;
    if (source.url.toLowerCase().endsWith(".pdf")) score += 8;
    if (host.endsWith(".edu") || host.endsWith(".ac.in") || host.endsWith(".edu.in")) score += 18;
    if (host.endsWith(".org") || host.endsWith(".in")) score += 8;
    if (/official website/i.test(source.usedFor)) score += 8;
    return score;
  } catch {
    return 0;
  }
}

async function probeCandidateUrl(url, input) {
  try {
    const response = await axios.get(url, {
      timeout: 7000,
      maxRedirects: 3,
      headers: { "User-Agent": SEARCH_USER_AGENT }
    });
    const $ = cheerio.load(response.data);
    $("script, style, noscript").remove();
    const title = $("title").text().replace(/\s+/g, " ").trim();
    const text = `${title} ${$("body").text().replace(/\s+/g, " ").slice(0, 6000)}`;
    if (tokenScore(text, input) >= 10) {
      return {
        title: title || url,
        url: normalizeUrl(response.request?.res?.responseUrl || url),
        sourceType: "Official Website",
        usedFor: "Likely official website discovered by domain probing"
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function probeLikelyOfficialSites(input) {
  const candidates = [];
  collegeAcronyms(input.collegeName).forEach((name) => {
    candidates.push(
      `https://www.${name}.ac.in/`,
      `https://${name}.ac.in/`,
      `https://www.${name}.edu.in/`,
      `https://${name}.edu.in/`,
      `https://www.${name}.org/`,
      `https://${name}.org/`,
      `https://www.${name}.in/`,
      `https://${name}.in/`
    );
  });

  const prioritized = [...new Set(candidates)].sort((a, b) => {
    const aShort = /\/\/(?:www\.)?(nit|hit|glbitm|uem|brainwareuniversity|arkajainuniversity)\./i.test(a) ? -1 : 0;
    const bShort = /\/\/(?:www\.)?(nit|hit|glbitm|uem|brainwareuniversity|arkajainuniversity)\./i.test(b) ? -1 : 0;
    return aShort - bShort;
  });
  const results = [];
  for (const url of prioritized.slice(0, 40)) {
    const source = await probeCandidateUrl(url, input);
    if (source && !results.some((item) => item.url === source.url)) results.push(source);
    if (results.length >= 3) break;
  }
  return results;
}

async function runSearch(query) {
  try {
    return await searchDuckDuckGo(query);
  } catch {
    return [];
  }
}

export async function findCollegeSourceUrls({ collegeName, city, state, officialWebsite, sourceUrls = [], extractionMode = "quick" }) {
  const normalized = normalizeCollegeName(collegeName);
  const input = { collegeName, city, state };
  const manualSources = [officialWebsite, ...sourceUrls]
    .filter(Boolean)
    .map((url) => ({
      title: url,
      url: normalizeUrl(url),
      sourceType: url === officialWebsite ? "Official Website" : "User Provided",
      usedFor: "User provided source"
    }))
    .filter((source) => source.url);

  const queries = buildSearchQueries({ collegeName, city, state });
  const queryLimit = extractionMode === "deep" ? 80 : 32;
  console.log("[AI search] normalized:", normalized);
  console.log("[AI search] queries:", queries.slice(0, queryLimit));

  const searched = (await Promise.all(queries.slice(0, queryLimit).map(runSearch))).flat();
  const probed = await probeLikelyOfficialSites(input);
  const combined = [...manualSources, ...probed, ...searched];
  const byUrl = new Map();

  combined.forEach((source) => {
    if (!source.url || byUrl.has(source.url)) return;
    const score = hostScore(source, input);
    if (score > -20) byUrl.set(source.url, { ...source, score });
  });

  const sources = [...byUrl.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, extractionMode === "deep" ? 45 : 18)
    .map(({ score, ...source }) => source);

  console.log("[AI search] found URLs:", sources.map((source) => source.url));
  return { normalized, queries, sources };
}
