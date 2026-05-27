import CollegeHistory from "../models/CollegeHistory.js";
import { buildCollegeIdentity } from "../utils/normalizeCollegeName.js";
import { courseDisplayKey } from "../utils/normalizeCourseName.js";

const protectedTopLevel = new Set(["_id", "__v", "createdAt", "updatedAt", "privateConsultancyDetails"]);
const protectedCourseFields = new Set(["incentive", "donation"]);

function hasValue(value) {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some(hasValue);
  return true;
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function confidenceFor(college, path) {
  const meta = college.fieldMeta;
  if (!meta) return college.confidenceScore || 0;
  const item = typeof meta.get === "function" ? meta.get(path) : meta[path];
  return item?.confidence || college.confidenceScore || 0;
}

function sourceFor(newCollege, path) {
  const source = (newCollege.sourceLinks || [])[0];
  return source?.url || source?.title || "AI extraction";
}

function shouldReplace({ existingValue, newValue, existingConfidence, newConfidence }) {
  if (!hasValue(newValue)) return false;
  if (!hasValue(existingValue)) return true;
  if (JSON.stringify(existingValue) === JSON.stringify(newValue)) return false;
  return newConfidence >= existingConfidence + 8;
}

function setFieldMeta(target, path, source, confidence, updatedBy) {
  if (!target.fieldMeta) target.fieldMeta = {};
  if (typeof target.fieldMeta.set === "function") {
    target.fieldMeta.set(path, { source, confidence, updatedBy, updatedAt: new Date() });
  } else {
    target.fieldMeta[path] = { source, confidence, updatedBy, updatedAt: new Date() };
  }
}

function mergeObject(existingRoot, newRoot, targetRoot, pathPrefix, context) {
  Object.entries(newRoot || {}).forEach(([key, newValue]) => {
    if (protectedTopLevel.has(key)) return;
    const path = pathPrefix ? `${pathPrefix}.${key}` : key;
    const existingValue = existingRoot?.[key];

    if (isObject(newValue)) {
      if (!targetRoot[key]) targetRoot[key] = {};
      mergeObject(existingValue || {}, newValue, targetRoot[key], path, context);
      return;
    }

    if (Array.isArray(newValue)) {
      if (!newValue.length) return;
      const merged = [...new Set([...(Array.isArray(existingValue) ? existingValue : []), ...newValue].filter(Boolean))];
      if (merged.length !== (existingValue || []).length) {
        targetRoot[key] = merged;
        context.changes.push({ path, oldValue: existingValue || [], newValue: merged, source: sourceFor(context.newCollege, path), confidence: context.newConfidence });
      }
      return;
    }

    const existingConfidence = confidenceFor(context.existingCollege, path);
    if (shouldReplace({ existingValue, newValue, existingConfidence, newConfidence: context.newConfidence })) {
      targetRoot[key] = newValue;
      setFieldMeta(context.targetCollege, path, sourceFor(context.newCollege, path), context.newConfidence, context.updatedBy);
      context.changes.push({ path, oldValue: existingValue ?? "", newValue, source: sourceFor(context.newCollege, path), confidence: context.newConfidence });
    }
  });
}

function mergeCourses(existingCourses = [], newCourses = [], context) {
  const byKey = new Map(existingCourses.map((course) => [courseDisplayKey(course), { ...course }]));
  let newCourseCount = 0;
  let improvedCourseCount = 0;

  newCourses.forEach((incoming) => {
    const key = courseDisplayKey(incoming);
    if (!key) return;
    const existing = byKey.get(key);
    if (!existing) {
      const cleanIncoming = {
        ...incoming,
        incentive: { incentiveAvailable: false, incentiveAmount: "", incentiveType: "", incentiveNotes: "" },
        donation: { donationApplicable: false, donationAmount: "", donationNotes: "" }
      };
      byKey.set(key, cleanIncoming);
      newCourseCount += 1;
      context.changes.push({ path: `courses.${incoming.courseName || key}`, oldValue: null, newValue: cleanIncoming, source: sourceFor(context.newCollege, "courses"), confidence: context.newConfidence });
      return;
    }

    Object.entries(incoming).forEach(([field, newValue]) => {
      if (protectedCourseFields.has(field)) return;
      const existingValue = existing[field];
      if (shouldReplace({ existingValue, newValue, existingConfidence: context.existingCollege.confidenceScore || 0, newConfidence: context.newConfidence })) {
        existing[field] = newValue;
        improvedCourseCount += 1;
        context.changes.push({ path: `courses.${existing.courseName || key}.${field}`, oldValue: existingValue ?? "", newValue, source: sourceFor(context.newCollege, "courses"), confidence: context.newConfidence });
      }
    });

    byKey.set(key, existing);
  });

  return {
    courses: [...byKey.values()],
    newCourseCount,
    improvedCourseCount
  };
}

export function buildMergePreview(existingCollege, newCollege) {
  const context = {
    existingCollege,
    targetCollege: structuredClone(existingCollege),
    newCollege,
    newConfidence: newCollege.confidenceScore || 0,
    updatedBy: "ai",
    changes: []
  };

  const merged = context.targetCollege;
  mergeObject(existingCollege, newCollege, merged, "", context);
  const courseResult = mergeCourses(existingCollege.courses || [], newCollege.courses || [], context);
  merged.courses = courseResult.courses;

  const identity = buildCollegeIdentity(merged);
  merged.normalizedCollegeName = identity.normalizedCollegeName;
  merged.aliases = [...new Set([...(merged.aliases || []), ...identity.aliases])];
  merged.websiteDomain = identity.websiteDomain;
  merged.confidenceScore = Math.max(existingCollege.confidenceScore || 0, newCollege.confidenceScore || 0);
  merged.verificationStatus = merged.confidenceScore >= 80 ? "Verified" : merged.confidenceScore >= 50 ? "Partially Verified" : "Low Confidence";
  merged.privateConsultancyDetails = existingCollege.privateConsultancyDetails;

  return {
    merged,
    changes: context.changes,
    summary: {
      changedFields: context.changes.length,
      newCourses: courseResult.newCourseCount,
      improvedCourseFields: courseResult.improvedCourseCount,
      preserved: ["private consultancy details", "course incentive fields", "course donation fields", "manual high-confidence fields"]
    }
  };
}

export async function mergeCollegeData(existingDoc, newCollege, options = {}) {
  const existing = existingDoc.toObject ? existingDoc.toObject() : existingDoc;
  const { merged, changes, summary } = buildMergePreview(existing, newCollege);
  delete merged._id;
  delete merged.__v;
  delete merged.createdAt;
  delete merged.updatedAt;
  existingDoc.set(merged);
  await existingDoc.save();

  if (changes.length) {
    await CollegeHistory.insertMany(
      changes.slice(0, 300).map((change) => ({
        college: existingDoc._id,
        action: "merge",
        ...change,
        updatedBy: options.updatedBy || "ai",
        summary: `Smart merge updated ${change.path}`
      }))
    );
  }

  return { college: existingDoc, changes, summary };
}
