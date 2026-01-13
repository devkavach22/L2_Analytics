import mongoose from "mongoose";
import OcrRecord from "../models/OcrRecords.js";
import AnalysisReport from "../models/AnalysisReports.js";
import { sendToOCR } from "../services/ocrService.js";
import { generateAgenticReport } from "../services/agenticServices.js";
import path from "path";
import fs from "fs";

export const analyzeReport = async (req, res) => {
  try {
    const file = req.file; // From file upload (if provided)
    const { keyword, reportType, fileId } = req.body; // From dropdown or input
    const userId = req.user.id; 

    // 1. Validate Input (Must have at least one source)
    if (!file && !keyword && !fileId) {
      return res.status(400).json({ msg: "Please provide a file, a keyword, or select a file from the workspace." });
    }

    const finalReportType = reportType || "Executive Summary";
    let extractedText = null;
    let sourceFilename = "";
    let sourcePath = "";

    console.log(`\n🚀 Analyze Request | User: ${userId} | Type: ${finalReportType}`);

    // =========================================================
    // SCENARIO A: KEYWORD SEARCH
    // =========================================================
    if (keyword && (!file && !fileId)) {
      console.log(`🔎 KEYWORD MODE: Searching DB for "${keyword}"...`);
      sourceFilename = `Query: "${keyword}"`;
      sourcePath = "Database Search";
      extractedText = null; 
    }

    // =========================================================
    // SCENARIO B: DROPDOWN SELECTION (Existing File via fileId)
    // =========================================================
    else if (fileId) {
        console.log(`📂 DROPDOWN MODE: Fetching record for File ID: "${fileId}"...`);
        
        // Find the record by fileId or _id
        const existingRecord = await OcrRecord.findOne({ 
            userId: userId, 
            $or: [
                { fileId: fileId }, 
                { _id: fileId }
            ]
        });

        if (!existingRecord) {
            return res.status(404).json({ msg: "Selected file not found in your workspace." });
        }

        console.log(`✔ Found record: ${existingRecord.fileName}`);
        
        sourceFilename = existingRecord.fileName;
        sourcePath = "Stored in DB"; // Virtual path
        
        // Use stored text
        if (existingRecord.extractedText && existingRecord.extractedText.trim().length > 10) {
            extractedText = existingRecord.extractedText;
            console.log(`⚡ Using stored text from DB (${extractedText.length} chars).`);
        } else {
            return res.status(400).json({ msg: "The selected file has no extracted text. Please re-upload it." });
        }
    }

    // =========================================================
    // SCENARIO C: NEW FILE UPLOAD
    // =========================================================
    else if (file) {
      console.log(`📂 UPLOAD MODE: Processing "${file.originalname}"...`);
      sourceFilename = file.originalname;
      sourcePath = file.path;

      // Check DB first to avoid re-OCR
      const existingRecord = await OcrRecord.findOne({ 
        userId: userId, 
        fileName: file.originalname 
      }).sort({ _id: -1 });

      if (existingRecord && existingRecord.extractedText && existingRecord.extractedText.trim().length > 50) {
        console.log(`✔ Found valid duplicate in DB. Using saved text.`);
        extractedText = existingRecord.extractedText; 
      } 
      else {
        // Run OCR if new
        console.log(`❌ New File. Starting OCR...`);
        
        if (!file.path) {
            return res.status(400).json({ msg: "File upload failed: No path received." });
        }

        extractedText = await sendToOCR(file.path);

        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(500).json({ msg: "OCR failed: No text extracted." });
        }

        // Save New OCR Record
        const newRecord = new OcrRecord({
          fileId: new mongoose.Types.ObjectId(),
          userId: userId,
          folderId: new mongoose.Types.ObjectId(),
          fileName: file.originalname,
          analysisStatus: "completed", 
          extractedText: extractedText
        });
        
        await newRecord.save();
        console.log("✔ New OCR Record saved.");
      }
    }

    // =========================================================
    // STEP 3: CALL PYTHON AI
    // =========================================================
    console.log(`🤖 Calling Python AI for ${finalReportType}...`);

    const agenticResponse = await generateAgenticReport(
      userId,
      finalReportType,
      keyword || null,
      extractedText
    );

    if (!agenticResponse || agenticResponse.success === false) {
        console.error("❌ Python AI Failed:", agenticResponse?.error);
        return res.status(400).json({ 
            msg: "AI Analysis Failed", 
            error: agenticResponse?.error || "Unknown error from AI service" 
        });
    }

    // =========================================================
    // STEP 4: SAVE REPORT
    // =========================================================
    const insight = agenticResponse.collection_insight || {};

    // Safety: Check if download_link exists before processing
    let filename = agenticResponse.download_link;
    let secureUrl = "";

    if (filename) {
        // Clean up if it returns a full path, we just want the name for the API URL
        if (filename.includes("/") || filename.includes("\\")) {
            filename = path.basename(filename);
        }
        secureUrl = `/api/pdf/download/${filename}`;
    } else {
        console.warn("⚠️ Warning: No download link returned from AI Service.");
    }

    const newAnalysisReport = new AnalysisReport({
      userId: userId,
      originalFilename: sourceFilename,
      filePath: sourcePath,
      generatedReportPath: secureUrl, 
      status: "completed",
      collectionInsight: {
        totalDocs: insight.total_docs || 0,
        contextDescription: insight.context_desc || "N/A"
      },
      analysisResult: {
        summary: agenticResponse.summary || "",
        keywords: agenticResponse.keywords || [],
        trends: agenticResponse.trends || [],
        decisions: agenticResponse.decisions || "",
        finalReportText: agenticResponse.final_report_text || ""
      }
    });

    await newAnalysisReport.save();
    console.log("✅ Report Saved.");

    res.json({ msg: "Analysis successful", data: newAnalysisReport });

  } catch (err) {
    console.error("❌ Controller Error:", err.message);
    // Explicitly showing err.response.data if available (from axios errors)
    const errorDetails = err.response?.data || err.message;
    res.status(500).json({ msg: "Server Error", error: errorDetails });
  }
};

export const downloadReport = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if(!req.user) {
        return res.status(401).json({ msg: "Unauthorized: Please login to download." });
    }
    
    // Ensure this matches where Python saves the PDF
    const reportsDir = path.join(process.cwd(), "static/reports"); 
    const filePath = path.join(reportsDir, filename);

    // Security Check (prevent Directory Traversal)
    if (!filePath.startsWith(reportsDir) || filename.includes("..") || filename.includes("/")) {
      return res.status(403).json({ msg: "Access denied: Invalid Filename." });
    }

    if (fs.existsSync(filePath)) {
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Download Error:", err);
          if (!res.headersSent) res.status(500).json({ msg: "Error downloading file." });
        }
      });
    } else {
      console.log(`File not found at: ${filePath}`);
      res.status(404).json({ msg: "File not found." });
    }
  }
  catch (err) {
    console.error("Download Controller Error:", err.message);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};