import mongoose from "mongoose";

const OcrRecordSchema = new mongoose.Schema({
  fileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "File", 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  folderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Folder",
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  extractedText: { 
    type: String, 
    default: "" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const OcrRecord = mongoose.model("OcrRecord", OcrRecordSchema);

export default OcrRecord;

// import mongoose from "mongoose";

// const OcrRecordSchema = new mongoose.Schema({
//   // --- EXISTING FIELDS ---
//   fileId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "File", 
//     required: true 
//   },
//   userId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "User", 
//     required: true 
//   },
//   folderId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "Folder",
//     required: true 
//   },
//   fileName: { 
//     type: String, 
//     required: true 
//   },
  
//   // Basic OCR Text (from your original logic)
//   extractedText: { 
//     type: String, 
//     default: "" 
//   },

//   // --- NEW FIELDS FOR FASTAPI AI ---
//   // Status of the AI processing
//   analysisStatus: { 
//     type: String, 
//     enum: ['pending', 'processing', 'completed', 'failed', 'not_started'], 
//     default: 'not_started' 
//   },

//   // The structured AI data returned from FastAPI
//   analysisResult: {
//     summary: { type: String, default: "" },
//     keywords: [{ type: String }],
//     trends: [{ type: String }],
//     decision: { type: String, default: "" }
//   },

//   createdAt: { 
//     type: Date, 
//     default: Date.now 
//   }
// });

// const OcrRecord = mongoose.model("OcrRecord", OcrRecordSchema);

// export default OcrRecord;