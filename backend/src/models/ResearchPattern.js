import mongoose from "mongoose";

const researchPatternSchema = new mongoose.Schema(
  {
    domain: { type: String, default: "", index: true },
    query: { type: String, default: "" },
    collegeType: { type: String, default: "" },
    fieldGroup: { type: String, default: "", index: true },
    fieldsFilled: [{ type: String }],
    coursesFound: { type: Number, default: 0 },
    feesFound: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

researchPatternSchema.index({ domain: 1, fieldGroup: 1 });

export default mongoose.model("ResearchPattern", researchPatternSchema);
