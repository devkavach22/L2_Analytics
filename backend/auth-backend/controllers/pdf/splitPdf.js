// controllers/pdf/splitPdf.js
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { OUTPUT_DIR, zipFiles, removeFiles } from "../../utils/fileUtils.js";

export const splitPdf = async (req, res) => {
  try {
    const file = req.file;
    const ranges = req.body.ranges; // Expect an array of { from: X, to: Y }

    if (!file)
      return res.status(400).json({ error: "Upload a PDF in field 'file'." });

    if (!ranges || !Array.isArray(ranges) || !ranges.length)
      return res.status(400).json({ error: "Provide at least one range in 'ranges'." });

    const buffer = fs.readFileSync(file.path);
    const src = await PDFDocument.load(buffer);
    const pageCount = src.getPageCount();
    const outPaths = [];
    const responseData = [];

    // Process each range
    for (let r = 0; r < ranges.length; r++) {
      const { from, to } = ranges[r];

      if (from < 1 || to > pageCount || from > to) {
        responseData.push({
          originalName: file.originalname,
          outputFile: null,
          message: `Invalid range: from ${from} to ${to}`,
          error: "Range out of bounds"
        });
        continue;
      }

      try {
        const newDoc = await PDFDocument.create();
        const pageIndices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
        const copied = await newDoc.copyPages(src, pageIndices);
        copied.forEach((p) => newDoc.addPage(p));

        const outName = `${path.parse(file.originalname).name}_range_${from}_to_${to}.pdf`;
        const outPath = path.join(OUTPUT_DIR, outName);
        const bytes = await newDoc.save();
        fs.writeFileSync(outPath, bytes);
        outPaths.push(outPath);

        responseData.push({
          originalName: file.originalname,
          outputFile: `/outputs/${outName}`,
          message: `Pages ${from} to ${to} split successfully`
        });
      } catch (err) {
        responseData.push({
          originalName: file.originalname,
          outputFile: null,
          message: `Pages ${from} to ${to} split failed`,
          error: err.message
        });
      }
    }

    // Cleanup uploaded PDF
    removeFiles([file.path]);

    let finalOutput = null;

    if (outPaths.length > 1) {
      const zipPath = await zipFiles(
        outPaths,
        `${path.parse(file.originalname).name}_split_${Date.now()}.zip`
      );
      finalOutput = `/outputs/${path.basename(zipPath)}`;
      // Optionally remove individual pages after zipping
      // removeFiles(outPaths);
    } else if (outPaths.length === 1) {
      finalOutput = `/outputs/${path.basename(outPaths[0])}`;
    }

    return res.json({
      message: "PDF split completed",
      outputFile: finalOutput,
      files: responseData
    });

  } catch (err) {
    console.error("splitPdf error:", err);
    return res.status(500).json({
      error: "Split failed: " + (err.message || err)
    });
  }
};
