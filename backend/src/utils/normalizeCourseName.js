const replacements = [
  [/\bcse\b/g, "computer science engineering"],
  [/\bcs\b/g, "computer science"],
  [/\bece\b/g, "electronics communication engineering"],
  [/\bee\b/g, "electrical engineering"],
  [/\bit\b/g, "information technology"],
  [/\bme\b/g, "mechanical engineering"],
  [/\bce\b/g, "civil engineering"],
  [/\bai\s*ml\b/g, "artificial intelligence machine learning"],
  [/\bai\s*&\s*ml\b/g, "artificial intelligence machine learning"],
  [/\bdata sci\b/g, "data science"],
  [/\bcomp\b/g, "computer"],
  [/\bengg\b/g, "engineering"]
];

const degreeAliases = [
  [/\bbachelor of technology\b/g, "btech"],
  [/\bb\.?\s*tech\b/g, "btech"],
  [/\bmaster of technology\b/g, "mtech"],
  [/\bm\.?\s*tech\b/g, "mtech"],
  [/\bbachelor of computer applications\b/g, "bca"],
  [/\bmaster of computer applications\b/g, "mca"],
  [/\bbachelor of business administration\b/g, "bba"],
  [/\bmaster of business administration\b/g, "mba"]
];

const stopWords = new Set(["in", "of", "and", "the", "with", "specialization", "specialisation", "course", "program", "programme"]);

export function normalizeCourseName(course = {}) {
  let value = `${course.courseName || ""} ${course.degreeType || ""} ${course.stream || ""}`
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  [...degreeAliases, ...replacements].forEach(([pattern, replacement]) => {
    value = value.replace(pattern, replacement);
  });

  return value
    .split(/\s+/)
    .filter((word) => word && !stopWords.has(word))
    .sort()
    .join(" ");
}

export function courseDisplayKey(course = {}) {
  return normalizeCourseName(course) || String(course.courseName || "").toLowerCase().trim();
}
