import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { OUTPUT_DIR } from "../../utils/fileUtils.js";

export const rotatePdf = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Upload a PDF in the 'file' field." });
    }

    // ranges input (string or JSON)
    let ranges = req.body.ranges;
    try {
      if (typeof ranges === "string") ranges = JSON.parse(ranges);
    } catch (err) {
      return res.status(400).json({ error: "Invalid JSON format for ranges" });
    }

    if (!Array.isArray(ranges) || ranges.length === 0) {
      return res.status(400).json({ error: "Invalid ranges array" });
    }

    const inputPath = file.path;
    const outName = `${path.parse(file.originalname).name}_rotated_${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, outName);

    const rangesString = JSON.stringify(ranges);

    // Run the Python script
    execFile(
      "python",
      [
        path.join("rotate_pdf.py"), 
        inputPath,
        outputPath,
        rangesString
      ],
      (error, stdout, stderr) => {
        if (error) {
          console.error("Python error:", stderr.toString());
          return res.status(500).json({ error: "Rotation failed." });
        }

        return res.json({
          message: "PDF rotated successfully",
          outputFile: `/outputs/${outName}`,
          pythonLogs: stdout.trim()
        });
      }
    );

  } catch (err) {
    console.error("rotatePdf error", err);
    return res.status(500).json({ error: err.message });
  }
};
