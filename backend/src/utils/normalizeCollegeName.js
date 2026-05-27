const typoFixes = [
  [/\binstitue\b/g, "institute"],
  [/\btecnology\b/g, "technology"],
  [/\btechnlogy\b/g, "technology"],
  [/\bengg\b/g, "engineering"],
  [/\buniv\b/g, "university"],
  [/\bclg\b/g, "college"],
  [/\bcollage\b/g, "college"]
];

const expansions = [
  { test: /\bgl\s*bajaj\b/, name: "gl bajaj institute of technology and management" },
  { test: /\bnarula\b/, name: "narula institute of technology" },
  { test: /\bhaldia\b/, name: "haldia institute of technology" },
  { test: /\barka\s*jain\b/, name: "arka jain university" },
  { test: /\bdy\s*patil\b|\bd\s*y\s*patil\b/, name: "d y patil" },
  { test: /\buem\s*kolkata\b|\buem\b/, name: "university of engineering and management kolkata" }
];

const looseStopWords = new Set([
  "institute",
  "college",
  "university",
  "technology",
  "technological",
  "engineering",
  "management",
  "science",
  "sciences",
  "and",
  "of",
  "the"
]);

function cleanName(name = "") {
  let value = String(name).toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  typoFixes.forEach(([pattern, replacement]) => {
    value = value.replace(pattern, replacement);
  });
  return value.replace(/\s+/g, " ").trim();
}

function titleCase(value) {
  return value
    .split(" ")
    .map((word) => (word.length <= 3 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

export function normalizeCollegeName(inputName = "") {
  const originalName = String(inputName || "").trim();
  const normalizedName = cleanName(originalName);
  const possible = new Set([originalName, normalizedName]);

  expansions.forEach(({ test, name }) => {
    if (test.test(normalizedName)) possible.add(name);
  });

  possible.add(titleCase(normalizedName));

  return {
    originalName,
    normalizedName,
    possibleNames: [...possible].filter(Boolean)
  };
}

export function looseCollegeKey(inputName = "") {
  return cleanName(inputName)
    .split(" ")
    .filter((word) => word && !looseStopWords.has(word))
    .join(" ");
}

export function getWebsiteDomain(url = "") {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function normalizeWebsite(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";
  try {
    const parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return value.replace(/^www\./, "").replace(/\/+$/, "").toLowerCase();
  }
}

export function extractDomain(url = "") {
  return getWebsiteDomain(url);
}

export function normalizePhone(phone = "") {
  return String(phone || "").replace(/[^0-9+]/g, "").trim();
}

export function buildCollegeIdentity(college = {}) {
  const name = college.basicInfo?.collegeName || college.collegeName || "";
  const normalized = normalizeCollegeName(name);
  const normalizedCollegeKey = looseCollegeKey(normalized.normalizedName);
  return {
    normalizedCollegeName: normalized.normalizedName,
    normalizedCollegeKey,
    aliases: [...new Set([normalized.originalName, normalized.normalizedName, normalizedCollegeKey, ...normalized.possibleNames].filter(Boolean))],
    websiteDomain: getWebsiteDomain(college.basicInfo?.officialWebsite || college.officialWebsite || "")
  };
}
