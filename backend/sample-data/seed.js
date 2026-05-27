import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import College from "../src/models/College.js";

dotenv.config();

const colleges = [
  {
    basicInfo: {
      collegeName: "Sample Institute of Technology",
      shortName: "SIT",
      establishmentYear: "2008",
      ownershipType: "Private",
      collegeType: "Engineering and Management",
      genderType: "Co-ed",
      campusArea: "25 acres",
      address: "Knowledge Park Road",
      city: "Pune",
      district: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      officialWebsite: "https://example.edu",
      contactNumber: "+91-9876543210",
      email: "admissions@example.edu"
    },
    affiliationApproval: {
      affiliatedUniversity: "Savitribai Phule Pune University",
      autonomousStatus: "No",
      ugcApproval: "Needs Verification",
      aicteApproval: "Approved",
      naacGrade: "B++",
      nbaAccreditation: "Needs Verification",
      nirfRanking: "Needs Verification",
      otherApprovals: "Needs Verification"
    },
    courses: [
      {
        courseName: "B.Tech Computer Science",
        degreeType: "B.Tech",
        stream: "Computer Science",
        duration: "4 years",
        eligibility: "10+2 with PCM",
        entranceExam: "JEE Main / State CET",
        annualFee: 125000,
        totalFee: 500000,
        seatIntake: 120,
        mode: "Regular"
      }
    ],
    admission: {
      admissionProcess: "Entrance exam followed by counselling",
      entranceExams: "JEE Main, State CET",
      directAdmissionAvailable: "Yes",
      counsellingProcess: "State counselling",
      managementQuota: "Available as per rules",
      importantDates: "Needs Verification",
      requiredDocuments: "10th, 12th, entrance scorecard, ID proof"
    },
    placements: {
      placementCellAvailable: "Yes",
      highestPackage: "12 LPA",
      averagePackage: "4.5 LPA",
      topRecruiters: "TCS, Infosys, Wipro",
      internshipSupport: "Yes",
      placementPercentage: "72%",
      placementSourceYear: "2024"
    },
    facilities: ["Hostel", "Library", "Labs", "Wi-Fi", "Sports", "Cafeteria"],
    reviewRecommendation: {
      academicQuality: "Good",
      facultyQuality: "Good",
      infrastructure: "Good",
      placementQuality: "Average",
      feesValue: "Good",
      locationAdvantage: "Strong",
      safety: "Good",
      hostelQuality: "Average",
      overallRecommendation: "Recommended after approval verification"
    },
    warnings: ["Needs verification"],
    warningNotes: "Approval and ranking claims should be checked from official sources.",
    sourceLinks: [
      {
        title: "Sample official website",
        url: "https://example.edu",
        sourceType: "Official Website",
        notes: "Dummy seed URL"
      }
    ],
    verificationStatus: "Needs Verification",
    confidenceScore: 72,
    fieldsNeedingVerification: ["affiliationApproval.ugcApproval", "affiliationApproval.nirfRanking"]
  }
];

await connectDB();
await College.deleteMany({});
await College.insertMany(colleges);
console.log("Sample college data inserted");
await mongoose.disconnect();

