import axios from "axios";
import { PDFParse } from "pdf-parse";

const PDF_TIMEOUT_MS = 20000;

export function isPdfUrl(url = "") {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return /\.pdf(?:$|\?)/i.test(url);
  }
}

export function cleanPdfText(text = "", maxLength = 18000) {
  const seen = new Set();
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => {
      const key = line.toLowerCase();
      if (line.length < 3 || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export async function extractPdfTextFromUrl(url, sourceMeta = {}) {
  const response = await axios.get(url, {
    timeout: PDF_TIMEOUT_MS,
    maxRedirects: 5,
    responseType: "arraybuffer",
    headers: {
      "User-Agent": "CollegeAIDataManager/1.0 (+local education consultancy research)"
    }
  });

  const parser = new PDFParse({ data: Buffer.from(response.data) });
  const parsed = await parser.getText();
  await parser.destroy();

  return {
    url,
    title: sourceMeta.title || url.split("/").pop() || "PDF brochure",
    text: cleanPdfText(parsed.text || ""),
    sourceType: sourceMeta.sourceType || "PDF Brochure",
    usedFor: sourceMeta.usedFor || "Brochure PDF extraction",
    isPdf: true,
    discoveredLinks: []
  };
}
