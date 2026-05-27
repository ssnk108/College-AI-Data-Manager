function valuePresent(value) {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some(valuePresent);
  return true;
}

function countFilledFields(section = {}) {
  return Object.values(section || {}).filter(valuePresent).length;
}

function feesFound(courses = []) {
  return courses.filter((course) => valuePresent(course.annualFee) || valuePresent(course.totalFee) || valuePresent(course.semesterFee) || valuePresent(course.minimumFee) || valuePresent(course.maximumFee)).length;
}

function placementFound(college = {}) {
  return [
    college.placements?.highestPackage,
    college.placements?.averagePackage,
    college.placements?.topRecruiters,
    college.placements?.placementPercentage
  ].some(valuePresent);
}

function approvalFound(college = {}) {
  return [
    college.affiliationApproval?.ugcApproval,
    college.affiliationApproval?.aicteApproval,
    college.affiliationApproval?.naacGrade,
    college.affiliationApproval?.nbaAccreditation,
    college.affiliationApproval?.nirfRanking
  ].some(valuePresent);
}

function addGap(gaps, section, field, reason, queryTemplates, sourceTypes) {
  gaps.push({ section, field, reason, queryTemplates, sourceTypes });
}

export function calculateExtractionQuality(college = {}) {
  let score = 0;
  const courseCount = college.courses?.length || 0;
  const feeCount = feesFound(college.courses || []);

  if (valuePresent(college.basicInfo?.officialWebsite)) score += 10;
  if ([college.basicInfo?.address, college.basicInfo?.city, college.basicInfo?.state].filter(valuePresent).length >= 2) score += 10;
  if (valuePresent(college.affiliationApproval?.affiliatedUniversity)) score += 10;
  if (approvalFound(college)) score += 10;
  if (courseCount >= 10) score += 20;
  else if (courseCount >= 5) score += 10;
  if (feeCount >= 5) score += 15;
  else if (feeCount > 0) score += 6;
  if (valuePresent(college.admission?.admissionProcess)) score += 10;
  if (placementFound(college)) score += 10;
  if ((college.facilities || []).length > 0) score += 5;
  if ((college.sourceLinks || []).length >= 5) score += 10;

  return Math.min(score, 100);
}

export function buildMissingFieldReport(college = {}, input = {}) {
  const gaps = [];
  const name = input.collegeName || college.basicInfo?.collegeName || "{college}";

  if (!valuePresent(college.basicInfo?.officialWebsite)) {
    addGap(gaps, "basicInfo", "officialWebsite", "No official site was identified from searched sources.", [
      `${name} official website`,
      `${name} ${input.state || ""} official website`
    ], ["official website", "DuckDuckGo", "institution domain probe"]);
  }
  if (!valuePresent(college.basicInfo?.address) || !valuePresent(college.basicInfo?.contactNumber) || !valuePresent(college.basicInfo?.email)) {
    addGap(gaps, "basicInfo", "address/contact/email", "Contact page may not have been scraped or the content is hidden in structured blocks.", [
      `${name} contact address`,
      `${name} contact official`,
      `${name} about contact`
    ], ["official contact page", "about page"]);
  }
  if ((college.courses || []).length < 10) {
    addGap(gaps, "courses", "courses", "Course catalog appears incomplete.", [
      `${name} courses fees`,
      `${name} all courses`,
      `${name} fee structure PDF`,
      `${name} admission brochure PDF`,
      `${name} departments`,
      `site:collegedunia.com "${name}" "${input.state || ""}"`,
      `site:shiksha.com "${name}" "${input.state || ""}"`,
      `site:collegedekho.com "${name}" "${input.state || ""}"`
    ], ["official academics page", "brochure PDF", "Collegedunia", "Shiksha", "CollegeDekho", "Careers360"]);
  }
  if (feesFound(college.courses || []) < 5) {
    addGap(gaps, "courses", "fees", "Course fees are missing for most courses.", [
      `${name} fee structure PDF`,
      `${name} courses and fees Collegedunia`,
      `${name} courses and fees Shiksha`,
      `${name} CollegeDekho fees`,
      `${name} hostel fees`
    ], ["fee PDF", "Collegedunia", "Shiksha", "CollegeDekho"]);
  }
  if (!valuePresent(college.admission?.admissionProcess)) {
    addGap(gaps, "admission", "admissionProcess", "Admission page/brochure did not yield a clear process.", [
      `${name} admission process`,
      `${name} admission brochure PDF`,
      `${name} eligibility admission`
    ], ["official admission page", "brochure PDF"]);
  }
  if (!placementFound(college)) {
    addGap(gaps, "placements", "placement data", "Placement package/recruiter fields were blank.", [
      `${name} placement report PDF`,
      `${name} highest package`,
      `${name} average package`,
      `${name} top recruiters`,
      `${name} NIRF placement`
    ], ["official placement page", "placement PDF", "Shiksha", "Careers360", "CollegeDekho"]);
  }
  if (!valuePresent(college.affiliationApproval?.affiliatedUniversity)) {
    addGap(gaps, "affiliationApproval", "affiliatedUniversity", "Affiliation/university relation was not confidently extracted.", [
      `${name} affiliation`,
      `${name} university affiliation`,
      `${name} UGC`
    ], ["official about page", "UGC", "university website"]);
  }
  if (!approvalFound(college)) {
    addGap(gaps, "affiliationApproval", "approvals/accreditation", "Approval/accreditation evidence is weak or missing.", [
      `${name} UGC approval`,
      `${name} AICTE approval`,
      `${name} NAAC grade`,
      `${name} NIRF ranking`,
      `${name} accreditation`
    ], ["UGC", "AICTE", "NAAC", "NIRF", "official accreditation page"]);
  }

  return gaps;
}

export function targetedQueriesFromGaps(gaps = []) {
  return [...new Set(gaps.flatMap((gap) => gap.queryTemplates || []).map((query) => query.replace(/\s+/g, " ").trim()).filter(Boolean))];
}

export function summarizeExtraction(college = {}, input = {}) {
  const missingFields = buildMissingFieldReport(college, input);
  return {
    basicInfoFilled: countFilledFields(college.basicInfo),
    affiliationApprovalFilled: countFilledFields(college.affiliationApproval),
    admissionFilled: countFilledFields(college.admission),
    placementFilled: countFilledFields(college.placements),
    coursesFound: college.courses?.length || 0,
    feesFound: feesFound(college.courses || []),
    facilitiesFound: college.facilities?.length || 0,
    sourceLinksFound: college.sourceLinks?.length || 0,
    blankFieldsCount: missingFields.length,
    missingFields,
    qualityScore: calculateExtractionQuality(college)
  };
}

export function shouldRetryExtraction(college = {}, mode = "quick") {
  const summary = summarizeExtraction(college);
  if (summary.qualityScore >= 70 && summary.coursesFound >= 8) return false;
  if (mode !== "deep" && summary.qualityScore >= 55) return false;
  return summary.missingFields.length > 0;
}
