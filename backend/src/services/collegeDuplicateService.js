import stringSimilarity from "string-similarity";
import mongoose from "mongoose";
import College from "../models/College.js";
import { buildCollegeIdentity, extractDomain, getWebsiteDomain, looseCollegeKey, normalizeCollegeName, normalizePhone } from "../utils/normalizeCollegeName.js";

function scoreText(a = "", b = "") {
  if (!a || !b) return 0;
  const left = String(a).toLowerCase().trim();
  const right = String(b).toLowerCase().trim();
  if (!left || !right) return 0;
  if (left === right) return 100;
  if (left.length >= 6 && right.includes(left)) return 95;
  if (right.length >= 6 && left.includes(right)) return 95;
  return Math.round(stringSimilarity.compareTwoStrings(left, right) * 100);
}

function bestNameScore(inputCollege, existingCollege) {
  const incoming = buildCollegeIdentity(inputCollege);
  const existing = buildCollegeIdentity(existingCollege);
  const namesA = [incoming.normalizedCollegeName, looseCollegeKey(incoming.normalizedCollegeName), ...(incoming.aliases || [])].filter(Boolean);
  const namesB = [existing.normalizedCollegeName, looseCollegeKey(existing.normalizedCollegeName), ...(existing.aliases || [])].filter(Boolean);
  let best = 0;
  namesA.forEach((a) => namesB.forEach((b) => {
    best = Math.max(best, scoreText(a, b));
  }));
  return best;
}

function locationScore(inputCollege, existingCollege) {
  const incoming = inputCollege.basicInfo || {};
  const existing = existingCollege.basicInfo || {};
  let score = 0;
  if (incoming.city && existing.city && incoming.city.toLowerCase() === existing.city.toLowerCase()) score += 8;
  if (incoming.state && existing.state && incoming.state.toLowerCase() === existing.state.toLowerCase()) score += 10;
  return score;
}

function websiteScore(inputCollege, existingCollege) {
  const incomingDomain = extractDomain(inputCollege.basicInfo?.officialWebsite || inputCollege.officialWebsite || inputCollege.websiteDomain || "");
  const existingDomain = existingCollege.websiteDomain || getWebsiteDomain(existingCollege.basicInfo?.officialWebsite || "");
  if (!incomingDomain || !existingDomain) return 0;
  return incomingDomain === existingDomain ? 40 : 0;
}

function affiliationScore(inputCollege, existingCollege) {
  return Math.round(scoreText(inputCollege.affiliationApproval?.affiliatedUniversity, existingCollege.affiliationApproval?.affiliatedUniversity) * 0.12);
}

function addressScore(inputCollege, existingCollege) {
  return Math.round(scoreText(inputCollege.basicInfo?.address, existingCollege.basicInfo?.address) * 0.1);
}

function emailScore(inputCollege, existingCollege) {
  const incoming = String(inputCollege.basicInfo?.email || inputCollege.email || "").trim().toLowerCase();
  const existing = String(existingCollege.basicInfo?.email || existingCollege.email || "").trim().toLowerCase();
  if (!incoming || !existing) return 0;
  return incoming === existing ? 50 : 0;
}

function phoneScore(inputCollege, existingCollege) {
  const incoming = normalizePhone(inputCollege.basicInfo?.contactNumber || inputCollege.contactNumber || "");
  const existing = normalizePhone(existingCollege.basicInfo?.contactNumber || existingCollege.contactNumber || "");
  if (!incoming || !existing) return 0;
  return incoming === existing ? 40 : 0;
}

function exactKeyScore(inputCollege, existingCollege) {
  const incoming = looseCollegeKey(normalizeCollegeName(inputCollege.basicInfo?.collegeName || inputCollege.collegeName || "").normalizedName);
  const existing = looseCollegeKey(normalizeCollegeName(existingCollege.basicInfo?.collegeName || existingCollege.collegeName || "").normalizedName);
  if (!incoming || !existing) return 0;
  if (incoming === existing) return 100;
  return Math.round(stringSimilarity.compareTwoStrings(incoming, existing) * 100);
}

export function calculateDuplicateScore(inputCollege, existingCollege) {
  const nameScore = bestNameScore(inputCollege, existingCollege);
  const keyScore = exactKeyScore(inputCollege, existingCollege);
  const duplicateScore = Math.max(nameScore, keyScore);
  const website = websiteScore(inputCollege, existingCollege);
  const email = emailScore(inputCollege, existingCollege);
  const phone = phoneScore(inputCollege, existingCollege);
  const score = Math.min(
    100,
    Math.round(
      duplicateScore * 0.6 +
      locationScore(inputCollege, existingCollege) +
      website +
      email +
      phone +
      affiliationScore(inputCollege, existingCollege) +
      addressScore(inputCollege, existingCollege)
    )
  );
  return {
    score,
    nameScore,
    isDuplicate: score >= 80 || website >= 40 || email >= 40 || phone >= 40,
    reasons: [
      keyScore >= 90 ? "Normalized name matched" : "",
      nameScore >= 85 ? `Name similarity ${nameScore}%` : "",
      website ? "Website domain matched" : "",
      email ? "Email matched" : "",
      phone ? "Phone matched" : "",
      locationScore(inputCollege, existingCollege) ? "Location matched" : "",
      affiliationScore(inputCollege, existingCollege) >= 8 ? "Affiliation similar" : "",
      addressScore(inputCollege, existingCollege) >= 8 ? "Address similar" : ""
    ].filter(Boolean)
  };
}

export async function findDuplicateCollege(inputCollege) {
  if (mongoose.connection.readyState !== 1) {
    console.log("[AI duplicate] MongoDB not connected; skipping duplicate lookup");
    return null;
  }
  const identity = buildCollegeIdentity(inputCollege);
  const normalized = normalizeCollegeName(inputCollege.basicInfo?.collegeName || inputCollege.collegeName || "");
  const city = inputCollege.basicInfo?.city;
  const state = inputCollege.basicInfo?.state;
  const domain = identity.websiteDomain;
  const email = String(inputCollege.basicInfo?.email || inputCollege.email || "").trim().toLowerCase();
  const phone = normalizePhone(inputCollege.basicInfo?.contactNumber || inputCollege.contactNumber || "");
  const nameRegex = new RegExp((looseCollegeKey(identity.normalizedCollegeName).split(" ")[0] || normalized.normalizedName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const candidates = await College.find({
    $or: [
      domain ? { websiteDomain: domain } : null,
      email ? { "basicInfo.email": email } : null,
      phone ? { "basicInfo.contactNumber": new RegExp(escapeRegExp(phone)) } : null,
      { normalizedCollegeName: { $in: [identity.normalizedCollegeName, ...normalized.possibleNames.map((name) => name.toLowerCase())] } },
      { aliases: { $in: normalized.possibleNames } },
      { "basicInfo.collegeName": nameRegex },
      city ? { "basicInfo.city": new RegExp(city, "i") } : null,
      state ? { "basicInfo.state": new RegExp(state, "i") } : null
    ].filter(Boolean)
  }).limit(40);

  const matches = candidates
    .map((college) => {
      const plain = college.toObject();
      return { college, plain, ...calculateDuplicateScore(inputCollege, plain) };
    })
    .filter((result) => result.isDuplicate)
    .sort((a, b) => b.score - a.score);

  const best = matches[0];
  if (!best || !best.isDuplicate) return null;
  return {
    existing: {
      _id: best.plain._id,
      collegeName: best.plain.basicInfo?.collegeName,
      city: best.plain.basicInfo?.city,
      state: best.plain.basicInfo?.state,
      website: best.plain.basicInfo?.officialWebsite,
      email: best.plain.basicInfo?.email,
      phone: best.plain.basicInfo?.contactNumber,
      verificationStatus: best.plain.verificationStatus,
      confidenceScore: best.plain.confidenceScore,
      matchReasons: best.reasons
    },
    score: best.score,
    reasons: best.reasons,
    matches: matches.map((match) => ({
      _id: match.plain._id,
      name: match.plain.basicInfo?.collegeName,
      city: match.plain.basicInfo?.city,
      state: match.plain.basicInfo?.state,
      website: match.plain.basicInfo?.officialWebsite,
      email: match.plain.basicInfo?.email,
      phone: match.plain.basicInfo?.contactNumber,
      verificationStatus: match.plain.verificationStatus,
      confidenceScore: match.plain.confidenceScore,
      matchReasons: match.reasons
    }))
  };
}
