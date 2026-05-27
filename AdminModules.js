import mongoose from 'mongoose';

// Report Model
const reportSchema = new mongoose.Schema({
  title: String,
  type: { type: String, enum: ['Single', 'State-wise', 'Course-wise', 'Full'] },
  filters: Object,
  format: { type: String, enum: ['PDF', 'XLSX', 'JSON'] },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  fileUrl: String,
}, { timestamps: true });

// Consultancy Data Model (PRIVATE)
const consultancySchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  contactPerson: String,
  designation: String,
  phone: String,
  email: String,
  whatsapp: String,
  mouStatus: { type: String, default: 'Not Started' },
  mouStartDate: Date,
  mouEndDate: Date,
  incentiveType: String,
  incentiveValue: String,
  paymentTerms: String,
  followUpDate: Date,
  priority: { type: String, default: 'Medium' },
  privateNotes: String,
}, { timestamps: true });

// Merge Queue Model
const mergeQueueSchema = new mongoose.Schema({
  primaryCollegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  duplicateCollegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  confidenceScore: Number,
  matchReasons: [String],
  status: { type: String, default: 'Pending' }, // Pending, Merged, Ignored
}, { timestamps: true });

// Extraction Log Model
const extractionLogSchema = new mongoose.Schema({
  collegeName: String,
  sourceUrl: String,
  extractionType: String,
  status: { type: String, enum: ['Success', 'Failed', 'Partial'] },
  rawInput: String,
  rawExtractedJson: Object,
  cleanedJson: Object,
  errorMessage: String,
  stackTrace: String,
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

// Settings Model (Key-Value)
const settingsSchema = new mongoose.Schema({
  category: String,
  settings: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export const Report = mongoose.model('Report', reportSchema);
export const ConsultancyData = mongoose.model('ConsultancyData', consultancySchema);
export const MergeQueue = mongoose.model('MergeQueue', mergeQueueSchema);
export const ExtractionLog = mongoose.model('ExtractionLog', extractionLogSchema);
export const Settings = mongoose.model('Settings', settingsSchema);