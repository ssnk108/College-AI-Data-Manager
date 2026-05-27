const API_URL = process.env.API_URL || "http://127.0.0.1:5000/api/ai/extract-college";

const colleges = [
  { collegeName: "gl bajaj", city: "Greater Noida", state: "Uttar Pradesh" },
  { collegeName: "narula institue", city: "Kolkata", state: "West Bengal" },
  { collegeName: "haldia", city: "Haldia", state: "West Bengal" },
  { collegeName: "Arka Jain", city: "Jamshedpur", state: "Jharkhand" },
  { collegeName: "D Y Patil", city: "Pune", state: "Maharashtra" },
  { collegeName: "Techno India Salt Lake", city: "Kolkata", state: "West Bengal" },
  { collegeName: "RVS College", city: "Jamshedpur", state: "Jharkhand" },
  { collegeName: "Brainware University", city: "Kolkata", state: "West Bengal" },
  { collegeName: "UEM Kolkata", city: "Kolkata", state: "West Bengal" },
  { collegeName: "Heritage Institute of Technology", city: "Kolkata", state: "West Bengal" }
];

function countMissing(data) {
  return [
    data.basicInfo?.officialWebsite,
    data.basicInfo?.address,
    data.affiliationApproval?.affiliatedUniversity,
    data.affiliationApproval?.aicteApproval,
    data.courses?.length ? "courses" : "",
    data.sourceLinks?.length ? "sources" : ""
  ].filter((value) => !value).length;
}

for (const college of colleges) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...college, directAdmissionAvailable: "Not Sure", ownershipInput: "Not Sure", sourceUrls: [] })
    });
    const data = await response.json();
    const serialized = JSON.stringify(data);
    console.log({
      input: college.collegeName,
      extractedName: data.basicInfo?.collegeName,
      officialWebsite: data.basicInfo?.officialWebsite,
      courses: data.courses?.length || 0,
      confidenceScore: data.confidenceScore,
      sourceLinks: data.sourceLinks?.length || 0,
      missingFields: countMissing(data),
      containsNeedsVerification: serialized.includes("Needs Verification")
    });
  } catch (error) {
    console.error({ input: college.collegeName, error: error.message });
  }
}

