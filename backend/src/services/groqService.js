import Groq from "groq-sdk";

export const aiCollegeJsonTemplate = {
  basicInfo: {
    collegeName: "",
    shortName: "",
    establishmentYear: "",
    ownershipType: "",
    collegeType: "",
    genderType: "",
    campusArea: "",
    address: "",
    city: "",
    district: "",
    state: "",
    pinCode: "",
    officialWebsite: "",
    contactNumber: "",
    email: ""
  },
  affiliationApproval: {
    affiliatedUniversity: "",
    autonomousStatus: "",
    ugcApproval: "",
    aicteApproval: "",
    naacGrade: "",
    nbaAccreditation: "",
    nirfRanking: "",
    pciApproval: "",
    bciApproval: "",
    ncteApproval: "",
    incApproval: "",
    otherApprovals: []
  },
  admission: {
    admissionProcess: "",
    entranceExams: [],
    directAdmissionAvailable: "",
    counsellingProcess: "",
    managementQuota: "",
    importantDates: "",
    requiredDocuments: []
  },
  placements: {
    placementCellAvailable: "",
    highestPackage: "",
    averagePackage: "",
    topRecruiters: [],
    internshipSupport: "",
    placementPercentage: "",
    placementSourceYear: ""
  },
  courses: [
    {
      courseName: "",
      degreeType: "",
      stream: "",
      duration: "",
      eligibility: "",
      entranceExam: "",
      annualFee: "",
      totalFee: "",
      semesterFee: "",
      minimumFee: "",
      maximumFee: "",
      hostelFee: "",
      admissionFee: "",
      cautionMoney: "",
      feeSource: "",
      courseSource: "",
      eligibilitySource: "",
      seatIntake: "",
      mode: "",
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
    }
  ],
  reviewRecommendation: {
    academicQuality: "",
    facultyQuality: "",
    infrastructure: "",
    placementQuality: "",
    feesValue: "",
    locationAdvantage: "",
    safety: "",
    hostelQuality: "",
    overallRecommendation: ""
  },
  facilities: [],
  warnings: [],
  sourceLinks: [
    {
      title: "",
      url: "",
      sourceType: "",
      usedFor: ""
    }
  ],
  verificationStatus: "Low Confidence",
  confidenceScore: 0,
  fieldsNeedingVerification: []
};

const requiredModels = [
  process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile"
];

function stripMarkdownJson(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first >= 0 && last > first) return candidate.slice(first, last + 1).trim();
  return candidate;
}

function parseJsonSafely(text) {
  return JSON.parse(stripMarkdownJson(text));
}

function sourceTextForPrompt(scrapedPages) {
  function keywordScore(page = {}) {
    const text = `${page.url || ""} ${page.title || ""} ${page.usedFor || ""}`.toLowerCase();
    let score = 0;
    if (/course|program|school|department|academics/.test(text)) score += 8;
    if (/fee|fees|hostel/.test(text)) score += 8;
    if (/admission|brochure|eligibility/.test(text)) score += 7;
    if (/placement|recruiter|package/.test(text)) score += 7;
    if (/contact|about/.test(text)) score += 5;
    if (/aicte|ugc|naac|nirf|approval|accredit/.test(text)) score += 5;
    if (/pdf/.test(text)) score += 6;
    return score;
  }

  return scrapedPages
    .filter((page) => page.text)
    .sort((a, b) => keywordScore(b) - keywordScore(a))
    .map(
      (page, index) =>
        `SOURCE ${index + 1}
URL: ${page.url}
TITLE: ${page.title}
SOURCE_TYPE: ${page.sourceType || "Web Page"}
USED_FOR: ${page.usedFor || ""}
TEXT:
${String(page.text).slice(0, 6500)}`
    )
    .join("\n\n---\n\n")
    .slice(0, 95000);
}

function buildPrompt({ collegeName, normalizedCollege, city, state, officialWebsite, scrapedPages, directAdmissionAvailable, ownershipInput, admissionNote }) {
  return `Extract structured college data for an education consultancy.

Target college:
- Name: ${collegeName}
- Normalized name: ${normalizedCollege?.normalizedName || ""}
- Possible names: ${(normalizedCollege?.possibleNames || []).join(" | ")}
- City: ${city || ""}
- State: ${state || ""}
- User-provided official website: ${officialWebsite || "Not provided"}
- Direct admission input: ${directAdmissionAvailable || ""}
- Ownership input: ${ownershipInput || ""}
- Admission note: ${admissionNote || ""}

Return only valid JSON matching this exact shape:
${JSON.stringify(aiCollegeJsonTemplate, null, 2)}

You are an advanced autonomous college research engine and expert education consultancy research assistant.

Your task:
Identify the correct college even if the user entered partial name, short name, or spelling mistake.
Use the college name, city, state, source URLs, and scraped text to extract maximum accurate data.
The goal is maximum accurate completion, not a short summary.
Use all provided scraped pages and source metadata.
Think like a deep research analyst working for ANY college type: university, engineering, MBA, medical, pharmacy, nursing, polytechnic, government, private, autonomous, deemed, or small local college.

Rules:
- Return only valid JSON.
- Do not write markdown.
- Do not write explanation.
- Use only the provided sources below and the target college identity.
- Prefer official college website pages over third-party pages.
- Prefer AICTE, UGC, NAAC, NBA, NIRF, university, and official accreditation pages for approvals.
- Use trusted education portals such as Collegedunia, Shiksha, CollegeDekho, Careers360, GetMyUni, CollegeBatch, CollegeVidya, UniversityKart, CampusOption, IIRF Ranking, EducationDunia, Sikshapedia, Embibe, and Aglasem for courses, fees, hostel fees, reviews, rankings, eligibility, cutoffs, placements, and specializations.
- When sources conflict, prefer official/government/accreditation sources first, then high priority education portals, then other portals.
- Never use the phrase "Needs Verification" inside any field.
- If a string value is unknown, return an empty string.
- If a list is unknown, return an empty array.
- If a number is unknown, return null.
- Do not leave everything blank when the sources include usable facts.
- Extract maximum possible courses from courses, fees, departments, academics, admission, and brochure pages.
- If multiple sources provide course lists, merge them.
- If fees differ, store the clearest value and add feeSource.
- Do not limit courses to only top courses.
- Extract placements, approvals, facilities, rankings, brochures, seat intake, hostel information, scholarships, eligibility, and accepted exams whenever sources mention them.
- Do not stop after partial information when later sources contain richer details.
- For every course include courseName, degreeType, stream, duration, eligibility, entranceExam, annualFee, totalFee, semesterFee, minimumFee, maximumFee, hostelFee, admissionFee, cautionMoney, seatIntake, mode, admissionType, courseSource, feeSource, eligibilitySource, incentive, and donation.
- Do not guess incentive or donation amounts.
- Keep incentive and donation values empty for manual entry; booleans should be false unless the user explicitly supplied admission context.
- Extract all available UG, PG, Diploma, lateral entry, and specialization courses. Do not stop at the top 5.
- For B.Tech, MBA, BCA, MCA, Diploma, M.Tech, BBA, B.Com, Nursing, Law, Pharmacy, Paramedical, Hotel Management, Animation, Design, and Agriculture programs, extract each specialization as a separate course when sources list them separately.
- For fees, packages, hostel fees, rankings, and approval claims, keep source-year/context if found.
- Summarize student reviews into consultancy-friendly academicQuality, facultyQuality, infrastructure, placementQuality, feesValue, locationAdvantage, safety, hostelQuality, and overallRecommendation fields.
- Create practical consultancy-style reviewRecommendation from available facts; mark uncertain points.
- Add warnings when data is missing, sources are weak, or approval/placement claims are not supported.
- Fill sourceLinks with every source that influenced the answer and explain usedFor.
- Calculate confidenceScore using this logic:
  Official website found +25, contact/address found +10, affiliation found +15, approvals found +15, courses found +15, placement data found +10, fees/admission found +10.
- If multiple similar colleges exist, choose the one matching city/state.
- Add fieldsNeedingVerification array separately.
- verificationStatus: 80-100 = "Verified", 50-79 = "Partially Verified", below 50 = "Low Confidence".

Collected source text:
${sourceTextForPrompt(scrapedPages) || "No readable source text was collected."}`;
}

async function repairJsonWithGroq({ groq, model, invalidText }) {
  const completion = await groq.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Convert the supplied content into valid JSON only. Do not add commentary. Never use the phrase Needs Verification inside any JSON field."
      },
      {
        role: "user",
        content: `Make this valid JSON matching the template. Template:\n${JSON.stringify(aiCollegeJsonTemplate)}\n\nContent:\n${invalidText}`
      }
    ]
  });

  return parseJsonSafely(completion.choices?.[0]?.message?.content || "{}");
}

export async function extractCollegeWithGroq({ collegeName, normalizedCollege, city, state, officialWebsite, scrapedPages, directAdmissionAvailable, ownershipInput, admissionNote }) {
  if (!process.env.GROQ_API_KEY) {
    return {
      ...aiCollegeJsonTemplate,
      basicInfo: { ...aiCollegeJsonTemplate.basicInfo, collegeName, city, state, officialWebsite },
      warnings: ["GROQ_API_KEY is not configured"],
      fieldsNeedingVerification: ["All AI fields"]
    };
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = buildPrompt({ collegeName, normalizedCollege, city, state, officialWebsite, scrapedPages, directAdmissionAvailable, ownershipInput, admissionNote });
  let lastError;

  for (const model of [...new Set(requiredModels.filter(Boolean))]) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a careful college-data extraction engine. Return only valid JSON. For unsupported facts use empty strings, empty arrays, or null numbers. Never use the phrase Needs Verification inside fields. Never hallucinate."
          },
          { role: "user", content: prompt }
        ]
      });

      const content = completion.choices?.[0]?.message?.content || "{}";
      try {
        const parsed = parseJsonSafely(content);
        console.log("[AI groq] JSON parse success");
        return parsed;
      } catch {
        console.log("[AI groq] JSON parse failed; attempting repair");
        return await repairJsonWithGroq({ groq, model, invalidText: content });
      }
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ...aiCollegeJsonTemplate,
    basicInfo: { ...aiCollegeJsonTemplate.basicInfo, collegeName, city, state, officialWebsite },
    warnings: [`AI extraction could not complete: ${lastError?.message || "Unknown Groq error"}`],
    fieldsNeedingVerification: ["All AI fields"]
  };
}
