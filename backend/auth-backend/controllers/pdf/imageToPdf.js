// controllers/pdf/imageToPdf.js
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";

// Standard page sizes in PDF points (like iLovePDF)
const PAGE_SIZES = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  Letter: [612, 792],
  Legal: [612, 1008]
};

// Margin mapping
const MARGINS = {
  No: 0,
  Small: 20,
  Big: 40
};

/**
 * POST /api/pdf/image-to-pdf
 * Accepts:
 *  - files[]
 *  - orientation: "portrait" | "landscape"
 *  - size: "A4" | "A3" | "Letter" | "Legal"
 *  - margin: "No" | "Small" | "Big"
 */
export const imageToPdf = async (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        error: "Upload one or more image files as 'files'."
      });
    }

    // Get settings from UI
    const {
      orientation = "portrait",
      size = "A4",
      margin = "Small"
    } = req.body;

    const selectedSize = PAGE_SIZES[size] || PAGE_SIZES["A4"];
    const selectedMargin = MARGINS[margin] ?? 20;

    // Page size logic
    let [pageWidth, pageHeight] = selectedSize;

    if (orientation === "landscape") {
      [pageWidth, pageHeight] = [pageHeight, pageWidth]; // swap
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const buffer = fs.readFileSync(file.path);

      // Convert all images to PNG for maximum compatibility
      const imgBuffer = await sharp(buffer).png().toBuffer();

      const img = await pdfDoc.embedPng(imgBuffer);
      const imgWidth = img.width;
      const imgHeight = img.height;

      // Add page
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Calculate scaled fit inside page with margins
      const maxWidth = pageWidth - selectedMargin * 2;
      const maxHeight = pageHeight - selectedMargin * 2;

      const widthRatio = maxWidth / imgWidth;
      const heightRatio = maxHeight / imgHeight;
      const scale = Math.min(widthRatio, heightRatio);

      const renderWidth = imgWidth * scale;
      const renderHeight = imgHeight * scale;

      const centerX = (pageWidth - renderWidth) / 2;
      const centerY = (pageHeight - renderHeight) / 2;

      // Draw image
      page.drawImage(img, {
        x: centerX,
        y: centerY,
        width: renderWidth,
        height: renderHeight
      });
    }

    const outName = `images_to_pdf_${Date.now()}.pdf`;
    const outPath = path.join(OUTPUT_DIR, outName);

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outPath, pdfBytes);

    // Delete temp uploads
    removeFiles(files.map(f => f.path));

    // SAME RESPONSE FORMAT AS pdfToWord.js
    return res.json({
      success: true,
      message: "Images converted to PDF successfully.",
      fileName: outName,
      downloadUrl: `/outputs/${outName}`
    });

  } catch (err) {
    console.error("imageToPdf error:", err);
    return res.status(500).json({
      success: false,
      error: "imageToPdf failed: " + (err.message || err)
    });
  }
};
