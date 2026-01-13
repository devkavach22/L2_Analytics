// controllers/pdf/compressPdf.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import FormData from "form-data";
import fetch from "node-fetch";
import { OUTPUT_DIR, removeFiles, zipFiles } from "../../utils/fileUtils.js";

dotenv.config(); // Load OCR_SPACE_API_KEY

/**
 * Determine dynamic compression quality based on file size
 * fileSize in bytes
 */
function getDynamicQuality(fileSize) {
  // Example thresholds (adjust as needed)
  if (fileSize > 20 * 1024 * 1024) return 40; // >20MB -> heavy compression
  if (fileSize > 10 * 1024 * 1024) return 50; // >10MB -> medium compression
  if (fileSize > 5 * 1024 * 1024) return 60;  // >5MB -> light compression
  return 80;                                   // <5MB -> minimal compression
}

/**
 * Compress PDF using pdf-lib + sharp
 */
async function compressPdfWithPdfLib(inputPath, outputPath, quality = 70) {
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const xObjects = page.node.Resources?.XObject || {};
    for (const key of Object.keys(xObjects)) {
      const obj = xObjects[key];
      if (obj && obj.contents) {
        const imgBuffer = obj.contents;
        try {
          const compressedBuffer = await sharp(imgBuffer)
            .jpeg({ quality })
            .toBuffer();
          obj.contents = compressedBuffer;
        } catch (err) {
          console.warn("Image compression failed for a page, skipping:", err.message);
        }
      }
    }
  }

  const compressedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, compressedPdfBytes);
  return outputPath;
}

/**
 * Optional: OCR for scanned PDFs
 */
async function extractTextFromPdf(inputPath) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) return "";

  const file = fs.createReadStream(inputPath);
  const formData = new FormData();
  formData.append("apikey", apiKey);
  formData.append("file", file);
  formData.append("language", "eng");

  try {
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data.ParsedResults?.map(r => r.ParsedText).join("\n") || "";
  } catch (err) {
    console.error("OCR.Space API error:", err.message);
    return "";
  }
}

export const compressPdf = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length)
      return res.status(400).json({ error: "Upload PDF(s) in 'files' or 'file'." });

    const responseData = [];

    for (const f of files) {
      const originalSize = fs.statSync(f.path).size;
      const quality = getDynamicQuality(originalSize);

      const outName = `${path.parse(f.originalname).name}_compressed_${Date.now()}.pdf`;
      const outPath = path.join(OUTPUT_DIR, outName);

      try {
        await compressPdfWithPdfLib(f.path, outPath, quality);

        const compressedSize = fs.statSync(outPath).size;
        const reduction = (((originalSize - compressedSize) / originalSize) * 100).toFixed(2);

        responseData.push({
          originalName: f.originalname,
          outputFile: `/output/${outName}`, // <-- PUBLIC URL
          originalSize,
          compressedSize,
          reduction: reduction + "%",
          message: "Compression successful"
        });

        removeFiles([f.path]);

      } catch (err) {
        responseData.push({
          originalName: f.originalname,
          outputFile: null,
          message: "Compression failed",
          error: err.message
        });
      }
    }

    // ALWAYS return JSON
    return res.json({
      message: "PDF compression completed",
      files: responseData
    });

  } catch (err) {
    console.error("compressPdf error:", err);
    return res.status(500).json({ error: "Compress failed: " + err.message });
  }
};

