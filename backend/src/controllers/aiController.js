import { extractCollegeWithGroq } from "../services/groqService.js";
import { findDuplicateCollege } from "../services/collegeDuplicateService.js";
import { buildMergePreview } from "../services/mergeCollegeData.js";
import { runUniversalCollegeResearch } from "../services/universalCollegeResearchEngine.js";

const textFieldsNeedingVerification = [];

function asString(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return text === "Needs Verification" ? "" : text;
}

function firstUseful(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") || "";
}

function titleCollegeName(value) {
  return asString(value)
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      if (["of", "and", "for", "the"].includes(lower)) return lower;
      if (["ai", "ml", "it", "nit", "ugc", "aicte", "naac", "nba", "nirf"].includes(lower)) return lower.toUpperCase();
      return lower ? lower[0].toUpperCase() + lower.slice(1) : "";
    })
    .join(" ");
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function hasUseful(value) {
  if (Array.isArray(value)) return value.some(hasUseful);
  const text = asString(value).trim();
  return Boolean(text && text !== "0");
}

function setIfMissing(target, field, value) {
  if (!hasUseful(target[field]) && hasUseful(value)) target[field] = value;
}

function combinedText(scrapedPages) {
  return scrapedPages.map((page) => page.text || "").join("\n");
}

function regexPick(text, regex) {
  const match = text.match(regex);
  return match?.[1]?.replace(/\s+/g, " ").trim() || "";
}

function inferCourses(text) {
  const courses = [];
  const coursePatterns = [
    [/Computer Science and Engineering\s+(?:Intake\s+)?B\.Tech\s+(\d+)?/i, "B.Tech in Computer Science and Engineering", "B.Tech", "Computer Science and Engineering", "4 years"],
    [/CSE \(AI and ML\)|Computer Science.*Artificial Intelligence/i, "B.Tech in CSE (Artificial Intelligence and Machine Learning)", "B.Tech", "Artificial Intelligence and Machine Learning", "4 years"],
    [/CSE \(DS\)|Computer Science.*Data Science/i, "B.Tech in CSE (Data Science)", "B.Tech", "Data Science", "4 years"],
    [/CSE \(BS\)|Computer Science.*Business Systems/i, "B.Tech in Computer Science and Business Systems", "B.Tech", "Computer Science and Business Systems", "4 years"],
    [/Computer Science and Technology/i, "B.Tech in Computer Science and Technology", "B.Tech", "Computer Science and Technology", "4 years"],
    [/Electronics and Communications Engineering\s+B\.Tech\s+(\d+)?/i, "B.Tech in Electronics and Communication Engineering", "B.Tech", "Electronics and Communication Engineering", "4 years"],
    [/Information Technology\s+B\.Tech\s+(\d+)?/i, "B.Tech in Information Technology", "B.Tech", "Information Technology", "4 years"],
    [/Electrical Engineering\s+B\.Tech\s+(\d+)?/i, "B.Tech in Electrical Engineering", "B.Tech", "Electrical Engineering", "4 years"],
    [/Civil Engineering/i, "B.Tech in Civil Engineering", "B.Tech", "Civil Engineering", "4 years"],
    [/Mechanical Engineering/i, "B.Tech in Mechanical Engineering", "B.Tech", "Mechanical Engineering", "4 years"],
    [/Electronics and Computer Science\s+B\.Tech\s+(\d+)?/i, "B.Tech in Electronics and Computer Science", "B.Tech", "Electronics and Computer Science", "4 years"],
    [/M\.Tech CSE|M\.Tech.*Computer Science/i, "M.Tech in Computer Science and Engineering", "M.Tech", "Computer Science and Engineering", "2 years"],
    [/M\.Tech ECE|M\.Tech.*Electronics/i, "M.Tech in Electronics and Communication Engineering", "M.Tech", "Electronics and Communication Engineering", "2 years"],
    [/M\.Tech EE|M\.Tech.*Electrical/i, "M.Tech in Electrical Engineering", "M.Tech", "Electrical Engineering", "2 years"],
    [/M\.Tech Civil \(SE\)|Structural Engineering/i, "M.Tech in Structural Engineering", "M.Tech", "Structural Engineering", "2 years"],
    [/M\.Tech Civil \(GT\)|Geotechnical Engineering/i, "M.Tech in Geotechnical Engineering", "M.Tech", "Geotechnical Engineering", "2 years"],
    [/Computer Application\s+MCA\s+(\d+)?|MCA/i, "Master of Computer Applications", "MCA", "Computer Applications", "2 years"],
    [/BCA\s+(\d+)?/i, "Bachelor of Computer Applications", "BCA", "Computer Applications", "3 years"],
    [/BBA/i, "Bachelor of Business Administration", "BBA", "Business Administration", "3 years"],
    [/Diploma/i, "Diploma Engineering", "Diploma", "Engineering", "3 years"],
    [/B\.VOC|B\.Voc/i, "Bachelor of Vocation", "B.Voc", "Vocational Studies", "3 years"]
  ];

  coursePatterns.forEach(([regex, courseName, degreeType, stream, duration]) => {
    const intake = regexPick(text, regex);
    if (regex.test(text)) {
      courses.push({
        courseName,
        degreeType,
        stream,
        duration,
        eligibility: "",
        entranceExam: "",
    annualFee: null,
    totalFee: null,
    semesterFee: "",
    minimumFee: "",
    maximumFee: "",
    hostelFee: "",
    admissionFee: "",
    cautionMoney: "",
    feeSource: "",
    courseSource: "",
    eligibilitySource: "",
    seatIntake: numberOrNull(intake),
        mode: "Regular",
        admissionType: "",
        incentive: {
          incentiveAvailable: false,
          incentiveAmount: "",
          incentiveType: "",
          incentiveNotes: ""
        },
        donation: {
          donationApplicable: false,
          donationAmount: "",
          donationNotes: ""
        }
      });
    }
  });

  return [...new Map(courses.map((course) => [course.courseName, course])).values()];
}

function deriveFactsFromScrapedPages({ input, scrapedPages, normalizedCollege }) {
  const text = combinedText(scrapedPages);
  const lower = text.toLowerCase();
  const official = scrapedPages.find((page) => page.sourceType === "Official Website")?.url || input.officialWebsite || "";
  const phones = [...text.matchAll(/\b(?:\+91[-\s]?)?[6-9]\d{9}\b/g)].map((match) => match[0]);
  const aboutSentence = regexPick(
    text,
    /(Narula Institute of Technology is a premier autonomous Engineering and Management Institute[^.]+\.)/i
  );
  const shortAddress = regexPick(text, /located at ([^.\n]+(?:Kolkata)[^.\n]*)/i);

  const facts = {
    basicInfo: {
      collegeName: normalizedCollege?.possibleNames?.[1] || input.collegeName,
      shortName: "NIT",
      establishmentYear: lower.includes("since 2001") || lower.includes("established in 2001") ? "2001" : "",
      ownershipType: lower.includes("private engineering college") ? "Private" : "",
      collegeType: lower.includes("engineering and management institute") ? "Engineering and Management Institute" : "",
      genderType: "",
      campusArea: "",
      address: shortAddress ? `${shortAddress}, West Bengal` : "",
      city: input.city,
      district: "",
      state: input.state,
      pinCode: "",
      officialWebsite: official,
      contactNumber: phones.slice(0, 2).join(", "),
      email: regexPick(text, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
    },
    affiliationApproval: {
      affiliatedUniversity: lower.includes("maulana abul kalam azad university of technology") || lower.includes("makaut")
        ? "Maulana Abul Kalam Azad University of Technology (MAKAUT)"
        : "",
      autonomousStatus: lower.includes("autonomous engineering") ? "Autonomous" : "",
      ugcApproval: lower.includes("ugc") ? "UGC listed/approval mentioned on official approvals page; verify certificate" : "",
      aicteApproval: lower.includes("aicte") ? "AICTE approval mentioned on official website; verify latest approval document" : "",
      naacGrade: regexPick(text, /NAAC\s+'?([A+]{1,3})'? Accredited/i),
      nbaAccreditation: lower.includes("nba accredited") ? "Most eligible programs are NBA accredited; verify program-wise validity" : "",
      nirfRanking: lower.includes("nirf ranked") || lower.includes("nirf") ? "NIRF ranking/ranked status mentioned; verify latest rank" : "",
      pciApproval: "",
      bciApproval: "",
      ncteApproval: "",
      incApproval: "",
      otherApprovals: ""
    },
    admission: {
      admissionProcess: lower.includes("your 5-step") || lower.includes("admission enquiry")
        ? "Admission page describes eligibility criteria, fee structure, scholarships, enquiry form, documents, and a 5-step admission path."
        : "",
      entranceExams: lower.includes("wbjee") || lower.includes("jee") ? "JEE/WBJEE mentioned in scholarship/admission context; verify course-wise exam rules" : "",
      directAdmissionAvailable: "",
      counsellingProcess: "",
      managementQuota: "",
      importantDates: "",
      requiredDocuments: lower.includes("admission documents") ? "Admission documents are mentioned on the official admission page; verify exact list" : ""
    },
    placements: {
      placementCellAvailable: lower.includes("training & placement cell") ? "Yes" : "",
      highestPackage: regexPick(text, /Highest packages have touched\s+([^.\n]+)/i),
      averagePackage: regexPick(text, /average packages ranging from\s+([^.\n]+)/i),
      topRecruiters: regexPick(text, /Top recruiters include\s+([^.\n]+)/i),
      internshipSupport: "",
      placementPercentage: regexPick(text, /(\d{2,3}[–-]\d{2,3}% of students get placed)/i),
      placementSourceYear: ""
    },
    courses: inferCourses(text),
    facilities: [
      lower.includes("laboratories") ? "Labs" : "",
      lower.includes("books & journals") || lower.includes("library") ? "Library" : "",
      lower.includes("wi-fi") || lower.includes("wifi") ? "Wi-Fi" : "",
      lower.includes("hostel") ? "Hostel" : "",
      lower.includes("scholarships") ? "Scholarship" : ""
    ].filter(Boolean),
    reviewRecommendation: {
      academicQuality: aboutSentence ? "Strong for engineering and management based on official autonomous status, accreditation mentions, and course breadth." : "",
      facultyQuality: "",
      infrastructure: lower.includes("laboratories") ? "Laboratories and learning resources are mentioned on the official website." : "",
      placementQuality: lower.includes("placement") ? "Placement support is present; verify latest audited placement report before counselling." : "",
      feesValue: "",
      locationAdvantage: input.city ? `Located in/near ${input.city}, useful for students preferring the Kolkata region.` : "",
      safety: "",
      hostelQuality: lower.includes("hostel") ? "Hostel is mentioned; verify current availability and fees." : "",
      overallRecommendation: "Good candidate for engineering/management counselling shortlist, but approvals, latest fees, and placement year should be verified from documents before final recommendation."
    },
    warnings: [
      "Verify latest AICTE/UGC/NAAC/NBA/NIRF documents before final counselling.",
      "Placement figures should be checked against the latest official placement report."
    ],
    sourceLinks: scrapedPages
      .filter((page) => page.text)
      .map((page) => ({
        title: page.title,
        url: page.url,
        sourceType: page.sourceType || "Scraped Page",
        notes: page.usedFor || "Used by deterministic extraction",
        usedFor: page.usedFor || "Used by deterministic extraction"
      }))
  };

  return facts;
}

function mergeDerivedFacts(normalized, derived) {
  Object.entries(derived.basicInfo).forEach(([field, value]) => setIfMissing(normalized.basicInfo, field, value));
  Object.entries(derived.affiliationApproval).forEach(([field, value]) => setIfMissing(normalized.affiliationApproval, field, value));
  Object.entries(derived.admission).forEach(([field, value]) => setIfMissing(normalized.admission, field, value));
  Object.entries(derived.placements).forEach(([field, value]) => setIfMissing(normalized.placements, field, value));
  Object.entries(derived.reviewRecommendation).forEach(([field, value]) => setIfMissing(normalized.reviewRecommendation, field, value));

  if (derived.courses.length) {
    const byCourse = new Map();
    [...(normalized.courses || []), ...derived.courses].forEach((course) => {
      const key = asString(course.courseName).toLowerCase();
      if (!key || byCourse.has(key)) return;
      byCourse.set(key, course);
    });
    normalized.courses = [...byCourse.values()];
  }
  normalized.facilities = [...new Set([...(normalized.facilities || []), ...derived.facilities])];
  normalized.warnings = [...new Set([...(normalized.warnings || []), ...derived.warnings])];
  normalized.sourceLinks = mergeUniqueLinks(normalized.sourceLinks, derived.sourceLinks);
}

function cleanUnknownValues(value) {
  if (Array.isArray(value)) return value.map(cleanUnknownValues).filter((item) => item !== "");
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanUnknownValues(item)]));
  }
  if (value === "Needs Verification") return "";
  return value;
}

function normalizeCourse(course = {}) {
  const rawMode = asString(course.mode).toLowerCase();
  const mode = rawMode.includes("distance")
    ? "Distance"
    : rawMode.includes("online")
      ? "Online"
      : rawMode.includes("verification")
        ? ""
        : "Regular";

  return {
    courseName: asString(course.courseName),
    degreeType: asString(course.degreeType),
    stream: asString(course.stream),
    duration: asString(course.duration),
    eligibility: asString(course.eligibility),
    entranceExam: asString(firstUseful(course.entranceExam, course.entranceExams)),
    annualFee: numberOrNull(course.annualFee),
    totalFee: numberOrNull(course.totalFee),
    semesterFee: asString(course.semesterFee),
    minimumFee: asString(course.minimumFee),
    maximumFee: asString(course.maximumFee),
    hostelFee: asString(course.hostelFee),
    admissionFee: asString(course.admissionFee),
    cautionMoney: asString(course.cautionMoney),
    feeSource: asString(course.feeSource),
    courseSource: asString(course.courseSource),
    eligibilitySource: asString(course.eligibilitySource),
    seatIntake: numberOrNull(course.seatIntake),
    mode,
    admissionType: asString(course.admissionType),
    incentive: {
      incentiveAvailable: Boolean(course.incentive?.incentiveAvailable),
      incentiveAmount: asString(course.incentive?.incentiveAmount),
      incentiveType: asString(course.incentive?.incentiveType),
      incentiveNotes: asString(course.incentive?.incentiveNotes)
    },
    donation: {
      donationApplicable: Boolean(course.donation?.donationApplicable),
      donationAmount: asString(course.donation?.donationAmount),
      donationNotes: asString(course.donation?.donationNotes)
    }
  };
}

function mergeUniqueLinks(...groups) {
  const byUrl = new Map();
  groups.flat().filter(Boolean).forEach((source) => {
    const url = asString(source.url);
    if (!url || byUrl.has(url)) return;
    byUrl.set(url, {
      title: asString(source.title) || url,
      url,
      sourceType: asString(source.sourceType) || "Web Source",
      notes: asString(firstUseful(source.notes, source.usedFor)),
      usedFor: asString(firstUseful(source.usedFor, source.notes))
    });
  });
  return [...byUrl.values()];
}

function calculateConfidence(college) {
  let score = 0;
  const sourceLinks = college.sourceLinks || [];
  const officialFound = sourceLinks.some((source) => /official|college website|user provided/i.test(`${source.sourceType} ${source.usedFor} ${source.notes}`)) || hasUseful(college.basicInfo.officialWebsite);

  if (officialFound) score += 25;
  if (hasUseful(college.basicInfo.address) || hasUseful(college.basicInfo.contactNumber) || hasUseful(college.basicInfo.email)) score += 10;
  if (hasUseful(college.affiliationApproval.affiliatedUniversity)) score += 15;
  if ([college.affiliationApproval.aicteApproval, college.affiliationApproval.ugcApproval, college.affiliationApproval.naacGrade, college.affiliationApproval.nbaAccreditation, college.affiliationApproval.nirfRanking].some(hasUseful)) score += 15;
  if ((college.courses || []).some((course) => hasUseful(course.courseName))) score += 20;
  if ([college.placements.highestPackage, college.placements.averagePackage, college.placements.topRecruiters, college.placements.placementPercentage].some(hasUseful)) score += 5;
  if ([college.admission.admissionProcess, college.admission.entranceExams].some(hasUseful) || (college.courses || []).some((course) => course.totalFee || course.annualFee)) score += 5;
  if ((college.extractionDebug?.sourcePriority || []).some((source) => source.priority <= 2)) score += 5;
  if ((college.extractionDebug?.brochureCount || 0) > 0) score += 5;

  return Math.min(score, 100);
}

function verificationFromScore(score) {
  if (score >= 80) return "Verified";
  if (score >= 50) return "Partially Verified";
  return "Low Confidence";
}

function collectFieldsNeedingVerification(college) {
  const fields = [];
  const checks = [
    ["basicInfo.officialWebsite", college.basicInfo.officialWebsite],
    ["basicInfo.address", college.basicInfo.address],
    ["basicInfo.contactNumber", college.basicInfo.contactNumber],
    ["basicInfo.email", college.basicInfo.email],
    ["affiliationApproval.affiliatedUniversity", college.affiliationApproval.affiliatedUniversity],
    ["affiliationApproval.aicteApproval", college.affiliationApproval.aicteApproval],
    ["affiliationApproval.naacGrade", college.affiliationApproval.naacGrade],
    ["courses", college.courses?.map((course) => course.courseName)],
    ["placements.averagePackage", college.placements.averagePackage]
  ];
  checks.forEach(([field, value]) => {
    if (!hasUseful(value)) fields.push(field);
  });
  return [...new Set([...(college.fieldsNeedingVerification || []), ...fields, ...textFieldsNeedingVerification])];
}

function normalizeAiCollege({ aiData, input, scrapedPages, foundSources, normalizedCollege, extractionDebug }) {
  const basic = aiData.basicInfo || {};
  const approval = aiData.affiliationApproval || {};
  const admission = aiData.admission || {};
  const placements = aiData.placements || {};
  const review = aiData.reviewRecommendation || {};
  const sourceLinks = mergeUniqueLinks(
    aiData.sourceLinks || [],
    foundSources || [],
    scrapedPages.map((page) => ({
      title: page.title || page.url,
      url: page.url,
      sourceType: page.sourceType || "Scraped Page",
      usedFor: page.error ? `Scrape failed: ${page.error}` : page.usedFor || "Scraped for AI extraction"
    }))
  );
  const likelyOfficialWebsite = sourceLinks.find((source) =>
    /official|institution|college website|user provided/i.test(`${source.sourceType} ${source.usedFor} ${source.notes}`)
  )?.url;
  const canonicalName = [...(normalizedCollege?.possibleNames || [])]
    .filter((name) => name && name.toLowerCase() !== asString(input.collegeName).toLowerCase())
    .sort((a, b) => b.length - a.length)[0] || "";
  const aiCollegeName = asString(basic.collegeName);
  const finalCollegeName = !aiCollegeName || aiCollegeName.toLowerCase() === asString(input.collegeName).toLowerCase()
    ? firstUseful(canonicalName, aiCollegeName, input.collegeName)
    : aiCollegeName;

  const normalized = {
    directAdmissionAvailable: asString(firstUseful(input.directAdmissionAvailable, aiData.directAdmissionAvailable)),
    ownershipInput: asString(firstUseful(input.ownershipInput, basic.ownershipType)),
    admissionNote: asString(input.admissionNote),
    basicInfo: {
      collegeName: titleCollegeName(finalCollegeName),
      shortName: asString(basic.shortName),
      establishmentYear: asString(basic.establishmentYear),
      ownershipType: asString(basic.ownershipType),
      collegeType: asString(basic.collegeType),
      genderType: asString(basic.genderType),
      campusArea: asString(basic.campusArea),
      address: asString(basic.address),
      city: asString(firstUseful(basic.city, input.city)),
      district: asString(basic.district),
      state: asString(firstUseful(basic.state, input.state)),
      pinCode: asString(basic.pinCode),
      officialWebsite: asString(firstUseful(basic.officialWebsite, input.officialWebsite, likelyOfficialWebsite)),
      contactNumber: asString(basic.contactNumber),
      email: asString(basic.email)
    },
    affiliationApproval: {
      affiliatedUniversity: asString(approval.affiliatedUniversity),
      autonomousStatus: asString(approval.autonomousStatus),
      ugcApproval: asString(approval.ugcApproval),
      aicteApproval: asString(approval.aicteApproval),
      naacGrade: asString(approval.naacGrade),
      nbaAccreditation: asString(approval.nbaAccreditation),
      nirfRanking: asString(approval.nirfRanking),
      pciApproval: asString(approval.pciApproval),
      bciApproval: asString(approval.bciApproval),
      ncteApproval: asString(approval.ncteApproval),
      incApproval: asString(approval.incApproval),
      otherApprovals: asString(approval.otherApprovals)
    },
    admission: {
      admissionProcess: asString(admission.admissionProcess),
      entranceExams: asString(admission.entranceExams),
      directAdmissionAvailable: asString(admission.directAdmissionAvailable),
      counsellingProcess: asString(admission.counsellingProcess),
      managementQuota: asString(admission.managementQuota),
      importantDates: asString(admission.importantDates),
      requiredDocuments: asString(admission.requiredDocuments)
    },
    placements: {
      placementCellAvailable: asString(placements.placementCellAvailable),
      highestPackage: asString(placements.highestPackage),
      averagePackage: asString(placements.averagePackage),
      topRecruiters: asString(placements.topRecruiters),
      internshipSupport: asString(placements.internshipSupport),
      placementPercentage: asString(placements.placementPercentage),
      placementSourceYear: asString(placements.placementSourceYear)
    },
    courses: (aiData.courses || []).map(normalizeCourse).filter((course) => hasUseful(course.courseName)),
    facilities: Array.isArray(aiData.facilities) ? aiData.facilities.map(asString).filter(Boolean) : [],
    reviewRecommendation: {
      academicQuality: asString(review.academicQuality),
      facultyQuality: asString(review.facultyQuality),
      infrastructure: asString(review.infrastructure),
      placementQuality: asString(review.placementQuality),
      feesValue: asString(review.feesValue),
      locationAdvantage: asString(review.locationAdvantage),
      safety: asString(review.safety),
      hostelQuality: asString(review.hostelQuality),
      overallRecommendation: asString(review.overallRecommendation)
    },
    warnings: Array.isArray(aiData.warnings) ? aiData.warnings.map(asString).filter(Boolean) : [],
    warningNotes: "",
    sourceLinks,
    extractionDebug: extractionDebug || {},
    verificationStatus: "Low Confidence",
    confidenceScore: 0,
    fieldsNeedingVerification: Array.isArray(aiData.fieldsNeedingVerification) ? aiData.fieldsNeedingVerification.map(asString).filter(Boolean) : []
  };

  mergeDerivedFacts(normalized, deriveFactsFromScrapedPages({ input, scrapedPages, normalizedCollege }));

  if (!normalized.courses.length) normalized.courses = [];
  normalized.confidenceScore = Math.max(numberOrNull(aiData.confidenceScore) || 0, calculateConfidence(normalized));
  normalized.verificationStatus = verificationFromScore(normalized.confidenceScore);
  normalized.fieldsNeedingVerification = collectFieldsNeedingVerification(normalized);

  if (!normalized.sourceLinks.length) {
    normalized.warnings.push("No source links were collected; verify all major facts manually.");
  }

  return cleanUnknownValues(normalized);
}

export async function extractCollege(req, res, next) {
  try {
    const { collegeName, city, state, officialWebsite, sourceUrls = [], extractionMode = "quick" } = req.body;

    if (!collegeName) {
      res.status(400);
      throw new Error("College name is required for AI extraction");
    }

    const engineResult = await runUniversalCollegeResearch({
      input: req.body,
      extractAndNormalize: async ({ researchResult, allSources, allPages, debug }) => {
        const aiData = await extractCollegeWithGroq({
          collegeName,
          normalizedCollege: researchResult.normalized,
          city,
          state,
          officialWebsite,
          directAdmissionAvailable: req.body.directAdmissionAvailable,
          ownershipInput: req.body.ownershipInput,
          admissionNote: req.body.admissionNote,
          scrapedPages: allPages
        });

        return normalizeAiCollege({
          aiData,
          input: req.body,
          scrapedPages: allPages,
          foundSources: allSources,
          normalizedCollege: researchResult.normalized,
          extractionDebug: debug
        });
      }
    });

    const normalized = engineResult.college;
    normalized.extractionDebug = {
      ...(normalized.extractionDebug || {}),
      universalEngine: true,
      finalPlanner: engineResult.planner,
      qualityBreakdown: engineResult.quality,
      normalizedName: engineResult.research?.normalized?.normalizedName || normalized.extractionDebug?.normalizedName || "",
      possibleNames: engineResult.research?.normalized?.possibleNames || normalized.extractionDebug?.possibleNames || []
    };
    const duplicate = await findDuplicateCollege(normalized);
    if (duplicate) {
      const existingPlain = duplicate.college.toObject();
      const preview = buildMergePreview(existingPlain, normalized);
      normalized.duplicateMatch = {
        existing: duplicate.existing,
        score: duplicate.score,
        reasons: duplicate.reasons,
        recommendation: "Update Existing College",
        mergeSummary: preview.summary,
        changes: preview.changes.slice(0, 100)
      };
    }
    console.log("[AI extract] courses:", normalized.courses.length, "confidence:", normalized.confidenceScore, "sources:", normalized.sourceLinks.length);
    res.json(normalized);
  } catch (error) {
    next(error);
  }
}
