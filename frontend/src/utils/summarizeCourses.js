const coursePatterns = [
  { label: "B.Tech", tests: [/\bb\.?\s*tech\b/i, /\bbachelor of technology\b/i, /\bengineering\b/i] },
  { label: "M.Tech", tests: [/\bm\.?\s*tech\b/i, /\bmaster of technology\b/i] },
  { label: "Diploma", tests: [/\bdiploma\b/i, /\bpolytechnic\b/i] },
  { label: "MBA", tests: [/\bmba\b/i, /\bmaster of business administration\b/i] },
  { label: "BBA", tests: [/\bbba\b/i, /\bbachelor of business administration\b/i] },
  { label: "MCA", tests: [/\bmca\b/i, /\bmaster of computer applications\b/i] },
  { label: "BCA", tests: [/\bbca\b/i, /\bbachelor of computer applications\b/i] },
  { label: "B.Com", tests: [/\bb\.?\s*com\b/i, /\bbachelor of commerce\b/i] },
  { label: "M.Com", tests: [/\bm\.?\s*com\b/i, /\bmaster of commerce\b/i] },
  { label: "B.Sc", tests: [/\bb\.?\s*sc\b/i, /\bbachelor of science\b/i] },
  { label: "M.Sc", tests: [/\bm\.?\s*sc\b/i, /\bmaster of science\b/i] },
  { label: "BA", tests: [/\bba\b/i, /\bb\.?\s*a\b/i, /\bbachelor of arts\b/i] },
  { label: "MA", tests: [/\bma\b/i, /\bm\.?\s*a\b/i, /\bmaster of arts\b/i] },
  { label: "B.Pharm", tests: [/\bb\.?\s*pharm\b/i, /\bbachelor of pharmacy\b/i] },
  { label: "D.Pharm", tests: [/\bd\.?\s*pharm\b/i, /\bdiploma in pharmacy\b/i] },
  { label: "LLB", tests: [/\bllb\b/i, /\bl\.?\s*l\.?\s*b\b/i] },
  { label: "B.Ed", tests: [/\bb\.?\s*ed\b/i, /\bbachelor of education\b/i] },
  { label: "BHM", tests: [/\bbhm\b/i, /\bhotel management\b/i] },
  { label: "Nursing", tests: [/\bnursing\b/i, /\bgnm\b/i, /\banm\b/i] },
  { label: "Ph.D", tests: [/\bph\.?\s*d\b/i, /\bdoctor of philosophy\b/i] }
];

function courseText(course = {}) {
  return `${course.degreeType || ""} ${course.courseName || ""} ${course.stream || ""}`.replace(/\s+/g, " ").trim();
}

function categoryForCourse(course = {}) {
  const text = courseText(course);
  const found = coursePatterns.find((pattern) => pattern.tests.some((test) => test.test(text)));
  if (found) return found.label;
  return (course.degreeType || course.courseName || "").split(/[(-]/)[0].replace(/\bin\b.*$/i, "").trim();
}

export function summarizeCourses(courses = [], maxVisible = 4) {
  const categories = [...new Set((courses || []).map(categoryForCourse).filter(Boolean))];
  const visible = categories.slice(0, maxVisible);
  const hiddenCount = Math.max(categories.length - visible.length, 0);
  return {
    categories,
    visible,
    hiddenCount,
    label: `${visible.join(", ")}${hiddenCount ? ` +${hiddenCount} more` : ""}`
  };
}
