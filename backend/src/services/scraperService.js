import axios from "axios";
import * as cheerio from "cheerio";
import { extractPdfTextFromUrl, isPdfUrl } from "./pdfResearchService.js";

const usefulPathWords = [
  "about",
  "contact",
  "course",
  "program",
  "department",
  "admission",
  "brochure",
  "placement",
  "career",
  "fee",
  "fees",
  "academics",
  "accredit",
  "approval",
  "aicte",
  "naac",
  "nba",
  "nirf"
];

function normalizeText(text) {
  const seen = new Set();
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => {
      if (line.length < 3 || seen.has(line.toLowerCase())) return false;
      seen.add(line.toLowerCase());
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 14000);
}

function toAbsoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

function findUsefulLinks($, pageUrl) {
  const baseHost = new URL(pageUrl).hostname.replace(/^www\./, "");
  const links = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") || "";
    const label = $(element).text().replace(/\s+/g, " ").trim();
    const url = toAbsoluteUrl(href, pageUrl);
    if (!url) return;

    try {
      const parsed = new URL(url);
      const sameHost = parsed.hostname.replace(/^www\./, "") === baseHost;
      const haystack = `${parsed.pathname} ${label}`.toLowerCase();
      if ((sameHost || parsed.pathname.toLowerCase().endsWith(".pdf")) && usefulPathWords.some((word) => haystack.includes(word))) {
        parsed.hash = "";
        links.push(parsed.toString());
      }
    } catch {
      // Ignore malformed links.
    }
  });

  return [...new Set(links)].slice(0, 8);
}

async function scrapeSingleUrl(url, sourceMeta = {}) {
  try {
    const isPdf = isPdfUrl(url);
    if (isPdf) {
      return extractPdfTextFromUrl(url, sourceMeta);
    }
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      responseType: "text",
      headers: {
        "User-Agent": "CollegeAIDataManager/1.0 (+local education consultancy research)"
      }
    });
    const $ = cheerio.load(response.data);
    $("script, style, noscript, svg, iframe, nav, footer").remove();

    const title = normalizeText($("title").text() || $("h1").first().text() || sourceMeta.title || url).slice(0, 220);
    const headings = $("h1,h2,h3").map((_, el) => $(el).text()).get().join("\n");
    const text = normalizeText(`${headings}\n${$("body").text()}`);

    return {
      url,
      title,
      text,
      sourceType: sourceMeta.sourceType || "Web Page",
      usedFor: sourceMeta.usedFor || "",
      discoveredLinks: findUsefulLinks($, url)
    };
  } catch (error) {
    return {
      url,
      title: sourceMeta.title || url,
      text: "",
      sourceType: sourceMeta.sourceType || "Web Page",
      usedFor: sourceMeta.usedFor || "",
      error: error.message
    };
  }
}

export async function scrapeUrls(sources, options = {}) {
  const normalizedSources = sources.map((source) => (typeof source === "string" ? { url: source } : source));
  const primaryLimit = options.mode === "deep" ? 40 : 18;
  const discoveredLimit = options.mode === "deep" ? 40 : 18;
  const uniqueSources = [...new Map(normalizedSources.filter((source) => source?.url).map((source) => [source.url, source])).values()].slice(0, primaryLimit);

  const firstPass = await Promise.all(uniqueSources.map((source) => scrapeSingleUrl(source.url, source)));
  const extraLinks = firstPass
    .flatMap((page) =>
      (page.discoveredLinks || []).map((url) => ({
        url,
        title: url,
        sourceType: "Discovered Page",
        usedFor: `Internal page discovered from ${page.url}`
      }))
    )
    .filter((source) => !uniqueSources.some((existing) => existing.url === source.url))
    .slice(0, discoveredLimit);

  const secondPass = await Promise.all(extraLinks.map((source) => scrapeSingleUrl(source.url, source)));
  const pages = [...firstPass, ...secondPass].map(({ discoveredLinks, ...page }) => page);
  console.log("[AI scrape] page count:", pages.length);
  console.log("[AI scrape] readable text length:", pages.reduce((sum, page) => sum + (page.text?.length || 0), 0));
  return pages;
}
