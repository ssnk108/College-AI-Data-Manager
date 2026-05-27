import mongoose from "mongoose";

const collegeHistorySchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true, index: true },
    action: { type: String, enum: ["create", "update", "merge"], default: "merge" },
    path: { type: String, default: "" },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    source: { type: String, default: "" },
    confidence: { type: Number, default: 0 },
    updatedBy: { type: String, default: "ai" },
    summary: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("CollegeHistory", collegeHistorySchema);
