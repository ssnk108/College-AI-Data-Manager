export const ownershipOptions = ["Government", "Private", "Semi-Government", "Deemed", "Autonomous"];
export const facilityOptions = ["Hostel", "Library", "Labs", "Wi-Fi", "Transport", "Sports", "Medical facility", "Cafeteria", "Scholarship", "Education loan support"];
export const warningOptions = ["Fake approval warning", "Affiliation mismatch", "Poor placement proof", "Hidden charges", "Needs verification"];

export function emptyCourse() {
  return {
    courseName: "",
    degreeType: "",
    stream: "",
    duration: "",
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
    seatIntake: null,
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
  };
}

export function emptySourceLink() {
  return { title: "", url: "", sourceType: "", usedFor: "", notes: "" };
}

export function createEmptyCollege() {
  return {
    directAdmissionAvailable: "",
    ownershipInput: "",
    admissionNote: "",
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
      otherApprovals: ""
    },
    courses: [emptyCourse()],
    admission: {
      admissionProcess: "",
      entranceExams: "",
      directAdmissionAvailable: "",
      counsellingProcess: "",
      managementQuota: "",
      importantDates: "",
      requiredDocuments: ""
    },
    placements: {
      placementCellAvailable: "",
      highestPackage: "",
      averagePackage: "",
      topRecruiters: "",
      internshipSupport: "",
      placementPercentage: "",
      placementSourceYear: ""
    },
    facilities: [],
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
    warnings: [],
    warningNotes: "",
    sourceLinks: [emptySourceLink()],
    extractionDebug: null,
    verificationStatus: "Low Confidence",
    confidenceScore: 0,
    fieldsNeedingVerification: []
  };
}
