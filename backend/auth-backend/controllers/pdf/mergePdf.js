// controllers/pdf/mergePdf.js
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";

export const mergePdf = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length)
      return res.status(400).json({ error: "Upload 2 or more PDFs in field 'files'." });
    if (files.length < 2)
      return res.status(400).json({ error: "At least 2 PDFs required to merge." });

    const mergedPdf = await PDFDocument.create();
    const responseData = [];

    // Preserve order as uploaded
    for (const f of files) {
      try {
        const bytes = fs.readFileSync(f.path);
        const doc = await PDFDocument.load(bytes);
        const copied = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copied.forEach((p) => mergedPdf.addPage(p));
      } catch (err) {
        responseData.push({
          originalName: f.originalname,
          outputFile: null,
          message: "Merge failed for this file",
          error: err.message,
        });
      }
    }

    if (!mergedPdf.getPageCount()) {
      // If no pages were added
      removeFiles(files.map((f) => f.path));
      return res.status(500).json({
        error: "Merge failed: No valid PDF pages found.",
      });
    }

    const outName = `merged_${Date.now()}.pdf`;
    const outPath = path.join(OUTPUT_DIR, outName);
    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync(outPath, mergedBytes);

    // Cleanup uploaded PDFs
    removeFiles(files.map((f) => f.path));

    responseData.push({
      originalName: files.map((f) => f.originalname).join(", "),
      outputFile: `/outputs/${outName}`, // public path for download
      message: "Merge successful",
    });

    return res.json({
      message: "PDF merge completed",
      files: responseData,
    });
  } catch (err) {
    console.error("mergePdf error:", err);
    return res.status(500).json({
      error: "Merge failed: " + (err.message || err),
    });
  }
};
