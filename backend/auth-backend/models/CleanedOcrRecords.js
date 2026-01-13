// models/CleanedOcrRecords.js
import mongoose from "mongoose";

const CleanedOcrRecordSchema = new mongoose.Schema({
  originalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "OcrRecord", required: true },
  filename: { type: String },
  cleanedText: { type: String, required: false, default: "" }, // <-- make optional
  fileType: { type: String },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const CleanedOcrRecord = mongoose.model("CleanedOcrRecord", CleanedOcrRecordSchema);

export default CleanedOcrRecord;