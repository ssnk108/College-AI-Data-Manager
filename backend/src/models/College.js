import mongoose from "mongoose";
import validator from "validator";

const courseSchema = new mongoose.Schema(
  {
    courseName: { type: String, default: "" },
    degreeType: { type: String, default: "" },
    stream: { type: String, default: "" },
    duration: { type: String, default: "" },
    eligibility: { type: String, default: "" },
    entranceExam: { type: String, default: "" },
    annualFee: { type: Number, default: null },
    totalFee: { type: Number, default: null },
    semesterFee: { type: String, default: "" },
    minimumFee: { type: String, default: "" },
    maximumFee: { type: String, default: "" },
    hostelFee: { type: String, default: "" },
    admissionFee: { type: String, default: "" },
    cautionMoney: { type: String, default: "" },
    feeSource: { type: String, default: "" },
    courseSource: { type: String, default: "" },
    eligibilitySource: { type: String, default: "" },
    seatIntake: { type: Number, default: null },
    mode: { type: String, enum: ["Regular", "Distance", "Online", ""], default: "" },
    admissionType: { type: String, default: "" },
    incentive: {
      incentiveAvailable: { type: Boolean, default: false },
      incentiveAmount: { type: String, default: "" },
      incentiveType: { type: String, enum: ["Fixed", "Percentage", "Other", ""], default: "" },
      incentiveNotes: { type: String, default: "" }
    },
    donation: {
      donationApplicable: { type: Boolean, default: false },
      donationAmount: { type: String, default: "" },
      donationNotes: { type: String, default: "" }
    }
  },
  { _id: false }
);

const sourceLinkSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    url: { type: String, default: "" },
    sourceType: { type: String, default: "" },
    notes: { type: String, default: "" },
    usedFor: { type: String, default: "" }
  },
  { _id: false }
);

const collegeSchema = new mongoose.Schema(
  {
    basicInfo: {
      collegeName: { type: String, required: true, trim: true },
      shortName: { type: String, default: "" },
      establishmentYear: { type: String, default: "" },
      ownershipType: {
        type: String,
        enum: ["Government", "Private", "Semi-Government", "Deemed", "Autonomous", ""],
        default: ""
      },
      collegeType: { type: String, default: "" },
      genderType: { type: String, default: "" },
      campusArea: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      state: { type: String, required: true, trim: true },
      pinCode: { type: String, default: "" },
      officialWebsite: {
        type: String,
        default: "",
        validate: {
          validator(value) {
            return !value || validator.isURL(value, { require_protocol: true });
          },
          message: "Official website must include http:// or https://"
        }
      },
      contactNumber: { type: String, default: "" },
      email: {
        type: String,
        default: "",
        validate: {
          validator(value) {
            return !value || validator.isEmail(value);
          },
          message: "Email format is invalid"
        }
      }
    },
    directAdmissionAvailable: { type: String, enum: ["Yes", "No", "Not Sure", ""], default: "" },
    ownershipInput: { type: String, enum: ["Government", "Private", "Semi-Government", "Not Sure", ""], default: "" },
    admissionNote: { type: String, default: "" },
    affiliationApproval: {
      affiliatedUniversity: { type: String, default: "" },
      autonomousStatus: { type: String, default: "" },
      ugcApproval: { type: String, default: "" },
      aicteApproval: { type: String, default: "" },
      naacGrade: { type: String, default: "" },
      nbaAccreditation: { type: String, default: "" },
      nirfRanking: { type: String, default: "" },
      pciApproval: { type: String, default: "" },
      bciApproval: { type: String, default: "" },
      ncteApproval: { type: String, default: "" },
      incApproval: { type: String, default: "" },
      otherApprovals: { type: String, default: "" }
    },
    courses: [courseSchema],
    admission: {
      admissionProcess: { type: String, default: "" },
      entranceExams: { type: String, default: "" },
      directAdmissionAvailable: { type: String, default: "" },
      counsellingProcess: { type: String, default: "" },
      managementQuota: { type: String, default: "" },
      importantDates: { type: String, default: "" },
      requiredDocuments: { type: String, default: "" }
    },
    placements: {
      placementCellAvailable: { type: String, default: "" },
      highestPackage: { type: String, default: "" },
      averagePackage: { type: String, default: "" },
      topRecruiters: { type: String, default: "" },
      internshipSupport: { type: String, default: "" },
      placementPercentage: { type: String, default: "" },
      placementSourceYear: { type: String, default: "" }
    },
    facilities: [{ type: String }],
    reviewRecommendation: {
      academicQuality: { type: String, default: "" },
      facultyQuality: { type: String, default: "" },
      infrastructure: { type: String, default: "" },
      placementQuality: { type: String, default: "" },
      feesValue: { type: String, default: "" },
      locationAdvantage: { type: String, default: "" },
      safety: { type: String, default: "" },
      hostelQuality: { type: String, default: "" },
      overallRecommendation: { type: String, default: "" }
    },
    warnings: [{ type: String }],
    warningNotes: { type: String, default: "" },
    sourceLinks: [sourceLinkSchema],
    extractionDebug: {
      extractionMode: { type: String, default: "" },
      normalizedName: { type: String, default: "" },
      possibleNames: [{ type: String }],
      searchedQueries: [{ type: String }],
      foundUrls: [{ type: String }],
      scrapedUrls: [{ type: String }],
      failedUrls: [{ type: String }],
      sourceCount: { type: Number, default: 0 },
      scrapedUrlCount: { type: Number, default: 0 },
      brochureCount: { type: Number, default: 0 },
      totalTextLength: { type: Number, default: 0 },
      sourcePriority: [
        {
          title: { type: String, default: "" },
          url: { type: String, default: "" },
          sourceType: { type: String, default: "" },
          priority: { type: Number, default: 4 },
          priorityLabel: { type: String, default: "" },
          usedFor: [{ type: String }]
        }
      ]
    },
    verificationStatus: {
      type: String,
      enum: ["Verified", "Partially Verified", "Low Confidence", "Needs Verification"],
      default: "Low Confidence"
    },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    fieldsNeedingVerification: [{ type: String }],
    privateConsultancyDetails: {
      visibleToAdminOnly: { type: Boolean, default: true },
      consultancyNotes: { type: String, default: "" },
      internalRemarks: { type: String, default: "" },
      preferredCounsellor: { type: String, default: "" },
      directAdmissionAvailable: { type: String, default: "" },
      managementQuotaAvailable: { type: String, default: "" },
      hostelCommissionAvailable: { type: String, default: "" },
      specialScholarshipAvailable: { type: String, default: "" },
      lastUpdatedBy: { type: String, default: "" },
      lastNegotiatedDate: { type: String, default: "" },
      privateWarnings: [{ type: String }],
      courseConsultancyData: [
        {
          courseName: { type: String, default: "" },
          incentive: {
            incentiveAvailable: { type: Boolean, default: false },
            incentiveAmount: { type: String, default: "" },
            incentiveType: { type: String, default: "" },
            incentiveNotes: { type: String, default: "" }
          },
          donation: {
            donationApplicable: { type: Boolean, default: false },
            donationAmount: { type: String, default: "" },
            donationNotes: { type: String, default: "" }
          },
          internalAdmissionNotes: { type: String, default: "" },
          priorityLevel: { type: String, default: "" },
          seatAvailability: { type: String, default: "" },
          counsellorNotes: { type: String, default: "" }
        }
      ]
    }
  },
  { timestamps: true }
);

collegeSchema.index({
  "basicInfo.collegeName": "text",
  "basicInfo.city": "text",
  "basicInfo.state": "text",
  "courses.courseName": "text",
  "courses.stream": "text"
});

export default mongoose.model("College", collegeSchema);
