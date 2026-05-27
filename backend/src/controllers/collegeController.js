import College from "../models/College.js";
import { buildCollegeIdentity } from "../utils/normalizeCollegeName.js";
import { findDuplicateCollege } from "../services/collegeDuplicateService.js";
import { buildMergePreview, mergeCollegeData } from "../services/mergeCollegeData.js";
import { sanitizeCollegeForPublic } from "../utils/sanitizeCollegeForPublic.js";

function publicCollege(college) {
  return sanitizeCollegeForPublic(college);
}

function withIdentity(data) {
  const identity = buildCollegeIdentity(data);
  return {
    ...data,
    normalizedCollegeName: identity.normalizedCollegeName,
    aliases: [...new Set([...(data.aliases || []), ...identity.aliases])],
    websiteDomain: identity.websiteDomain
  };
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildCollegeQuery(query) {
  const conditions = [];
  const searchText = String(query.search || "").trim();

  if (searchText) {
    const regex = new RegExp(escapeRegExp(searchText), "i");
    conditions.push({
      $or: [
        { "basicInfo.collegeName": regex },
        { "basicInfo.shortName": regex },
        { "basicInfo.city": regex },
        { "basicInfo.state": regex },
        { normalizedCollegeName: regex },
        { aliases: regex },
        { "affiliationApproval.affiliatedUniversity": regex },
        { "courses.courseName": regex }
      ]
    });
  }

  if (query.state) conditions.push({ "basicInfo.state": new RegExp(escapeRegExp(query.state), "i") });
  if (query.city) conditions.push({ "basicInfo.city": new RegExp(escapeRegExp(query.city), "i") });
  if (query.ownership) conditions.push({ "basicInfo.ownershipType": query.ownership });
  if (query.course) conditions.push({ "courses.courseName": new RegExp(escapeRegExp(query.course), "i") });
  if (query.approval) {
    conditions.push({
      $or: [
        { "affiliationApproval.ugcApproval": new RegExp(escapeRegExp(query.approval), "i") },
        { "affiliationApproval.aicteApproval": new RegExp(escapeRegExp(query.approval), "i") },
        { "affiliationApproval.otherApprovals": new RegExp(escapeRegExp(query.approval), "i") }
      ]
    });
  }
  if (query.verificationStatus) conditions.push({ verificationStatus: query.verificationStatus });

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

function buildSort(sortBy = "updatedAt", order = "desc") {
  const direction = order === "asc" ? 1 : -1;
  const sortMap = {
    fees: { "courses.totalFee": direction },
    placement: { "placements.averagePackage": direction },
    ranking: { "affiliationApproval.nirfRanking": direction },
    updatedAt: { updatedAt: direction }
  };

  return sortMap[sortBy] || sortMap.updatedAt;
}

export async function createCollege(req, res, next) {
  try {
    const forceCreate = req.query.force === "true" || req.body.forceCreate === true || req.body.forceCreateSeparate === true;
    const body = withIdentity(req.body);
    if (!forceCreate) {
      const duplicate = await findDuplicateCollege(body);
      if (duplicate) {
        const existingPlain = duplicate.college.toObject();
        const preview = buildMergePreview(existingPlain, body);
        return res.status(409).json({
          duplicate: true,
          message: "Possible duplicate college found",
          matches: duplicate.matches,
          duplicateMatch: {
            existing: duplicate.existing,
            score: duplicate.score,
            reasons: duplicate.reasons,
            mergeSummary: preview.summary,
            changes: preview.changes.slice(0, 80)
          }
        });
      }
    }
    const college = await College.create(body);
    res.status(201).json(publicCollege(college));
  } catch (error) {
    res.status(400);
    next(error);
  }
}

export async function getColleges(req, res, next) {
  try {
    const colleges = await College.find(buildCollegeQuery(req.query)).sort(buildSort(req.query.sortBy, req.query.order));
    res.json(colleges.map(publicCollege));
  } catch (error) {
    next(error);
  }
}

export async function getCollegeById(req, res, next) {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      res.status(404);
      throw new Error("College not found");
    }
    res.json(publicCollege(college));
  } catch (error) {
    next(error);
  }
}

export async function getCollegeByIdAdmin(req, res, next) {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      res.status(404);
      throw new Error("College not found");
    }
    res.json(college);
  } catch (error) {
    next(error);
  }
}

export async function updateCollege(req, res, next) {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, withIdentity(req.body), {
      new: true,
      runValidators: true
    });
    if (!college) {
      res.status(404);
      throw new Error("College not found");
    }
    res.json(publicCollege(college));
  } catch (error) {
    res.status(res.statusCode === 200 ? 400 : res.statusCode);
    next(error);
  }
}

export async function mergeCollege(req, res, next) {
  try {
    const existing = await College.findById(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error("College not found");
    }
    const newCollege = withIdentity(req.body.college || req.body);
    const result = await mergeCollegeData(existing, newCollege, { updatedBy: req.body.updatedBy || "ai" });
    res.json({
      college: publicCollege(result.college),
      mergeSummary: result.summary,
      changes: result.changes.slice(0, 120)
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCollege(req, res, next) {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) {
      res.status(404);
      throw new Error("College not found");
    }
    res.json({ message: "College deleted" });
  } catch (error) {
    next(error);
  }
}
