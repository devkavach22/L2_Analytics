import mongoose from "mongoose";
import { type } from "os";

const fileSchema = new mongoose.Schema({
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  
  url: { type: String, required: true },

  originalName: String,
  storedName: String,
  size: Number,
  extension: String,
  mimeType: String,
  localPath: String,
  publicPath: String,
  extractedText: { type: String, default: "" },   // 👈 NEW FIELD
  // uploadDate: Date

  uploadDate: { type: Date, default: Date.now }
});

export default mongoose.model("File", fileSchema);
