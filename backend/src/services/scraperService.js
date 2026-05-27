import axios from "axios";
import * as cheerio from "cheerio";
import { extractPdfTextFromUrl, isPdfUrl } from "./pdfResearchService.js";

const usefulPathWords = [
  "about",
  "contact",
  "course",
  "courses",
  "program",
  "programme",
  "programmes",
  "department",
  "school",
  "admission",
  "admissions",
  "brochure",
  "placement",
  "placements",
  "training",
  "recruiter",
  "career",
  "fee",
  "fees",
  "fee-structure",
  "academics",
  "syllabus",
  "accredit",
  "approval",
  "aicte",
  "naac",
  "nba",
  "nirf"
];

function normalizeText(text, maxLength = 18000) {
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
    .slice(0, maxLength);
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

  return [...new Set(links)].slice(0, 18);
}

function extractStructuredText($) {
  const chunks = [];

  $("table").each((_, table) => {
    const rows = [];
    $(table).find("tr").each((__, row) => {
      const cells = $(row).find("th,td").map((___, cell) => $(cell).text().replace(/\s+/g, " ").trim()).get().filter(Boolean);
      if (cells.length) rows.push(cells.join(" | "));
    });
    if (rows.length) chunks.push(`TABLE:\n${rows.join("\n")}`);
  });

  $("ul,ol").each((_, list) => {
    const items = $(list).find("li").map((__, li) => $(li).text().replace(/\s+/g, " ").trim()).get().filter((item) => item.length > 2);
    if (items.length) chunks.push(`LIST:\n${items.join("\n")}`);
  });

  $("script[type='application/ld+json']").each((_, script) => {
    const raw = $(script).contents().text().replace(/\s+/g, " ").trim();
    if (raw) chunks.push(`JSON-LD:\n${raw.slice(0, 6000)}`);
  });

  const nextData = $("script#__NEXT_DATA__").contents().text();
  if (nextData) {
    chunks.push(`NEXT_DATA:\n${nextData.replace(/\s+/g, " ").slice(0, 12000)}`);
  }

  $("script").each((_, script) => {
    const raw = $(script).contents().text();
    if (/(course|fee|placement|package|eligibility|admission|recruiter)/i.test(raw)) {
      chunks.push(`EMBEDDED_DATA:\n${raw.replace(/\s+/g, " ").slice(0, 6000)}`);
    }
  });

  return chunks.join("\n\n");
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
    const structuredText = extractStructuredText($);
    $("style, noscript, svg, iframe, nav, footer").remove();

    const title = normalizeText($("title").text() || $("h1").first().text() || sourceMeta.title || url).slice(0, 220);
    const headings = $("h1,h2,h3").map((_, el) => $(el).text()).get().join("\n");
    const cards = $("[class*='course'], [class*='fee'], [class*='placement'], [class*='admission'], [class*='program']")
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .filter((item) => item.length > 20)
      .slice(0, 80)
      .join("\n");
    $("script").remove();
    const text = normalizeText(`${headings}\n${structuredText}\nCOURSE_FEE_CARDS:\n${cards}\n${$("body").text()}`, sourceMeta.priority <= 2 ? 26000 : 18000);

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
  const discoveredLimit = options.mode === "deep" ? 60 : 18;
  const uniqueSources = [...new Map(normalizedSources.filter((source) => source?.url).map((source) => [source.url, source])).values()].slice(0, primaryLimit);

  const firstPass = await Promise.all(uniqueSources.map((source) => scrapeSingleUrl(source.url, source)));
  const seenUrls = new Set(uniqueSources.map((source) => source.url));
  const collectLinks = (pages, label) =>
    pages
      .flatMap((page) =>
        (page.discoveredLinks || []).map((url) => ({
          url,
          title: url,
          sourceType: "Discovered Page",
          usedFor: `${label} discovered from ${page.url}`
        }))
      )
      .filter((source) => {
        if (seenUrls.has(source.url)) return false;
        seenUrls.add(source.url);
        return true;
      });

  const extraLinks = collectLinks(firstPass, "Internal page").slice(0, discoveredLimit);
  const secondPass = await Promise.all(extraLinks.map((source) => scrapeSingleUrl(source.url, source)));
  const thirdLinks = options.mode === "deep" ? collectLinks(secondPass, "Nested internal page").slice(0, 50) : [];
  const thirdPass = thirdLinks.length ? await Promise.all(thirdLinks.map((source) => scrapeSingleUrl(source.url, source))) : [];
  const pages = [...firstPass, ...secondPass, ...thirdPass].map(({ discoveredLinks, ...page }) => page);
  console.log("[AI scrape] page count:", pages.length);
  console.log("[AI scrape] readable text length:", pages.reduce((sum, page) => sum + (page.text?.length || 0), 0));
  return pages;
}
