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

