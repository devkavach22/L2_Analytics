import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";
import pkg from "uuid";
const { v4: uuid } = pkg;

// Ensure OUTPUT_DIR exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

export const pdfToExcel = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) {
      return res.status(400).json({ error: "Upload PDF(s) in 'files' or 'file'." });
    }

    const responseData = [];

    for (const f of files) {
      const baseName = path.parse(f.originalname).name.replace(/[^a-zA-Z0-9-_]/g, "_");
      const outName = `${baseName}_${Date.now()}.xlsx`;
      const outPath = path.join(OUTPUT_DIR, outName);
      const pythonScript = path.join(process.cwd(), "pdf_to_excel.py");

      try {
        if (!fs.existsSync(pythonScript)) {
          throw new Error("Python script pdf_to_excel.py not found.");
        }

        await new Promise((resolve, reject) => {
          execFile("python", [pythonScript, f.path, outPath], (err, stdout, stderr) => {
            console.log("Python stdout:", stdout);
            console.log("Python stderr:", stderr);
            if (err) return reject(new Error(stderr || err));

            // Optional: handle JSON output from Python if your script returns info
            try {
              const parsed = JSON.parse(stdout);
              if (parsed?.status === "error") {
                return reject(new Error(parsed.message || "Python script reported error."));
              }
            } catch (e) {
              // Ignore if stdout isn't JSON
            }

            resolve(stdout);
          });
        });

        if (!fs.existsSync(outPath)) {
          throw new Error("Excel file not generated.");
        }

        responseData.push({
          originalName: f.originalname,
          outputFile: `/outputs/${outName}`, // public download path
          message: "Conversion successful"
        });

        removeFiles([f.path]); // delete uploaded PDF

      } catch (err) {
        responseData.push({
          originalName: f.originalname,
          outputFile: null,
          message: "Conversion failed",
          error: err.message
        });
      }
    }

    return res.json({
      message: "PDF to Excel conversion completed",
      files: responseData
    });

  } catch (err) {
    console.error("pdfToExcel error:", err);
    return res.status(500).json({ error: "pdfToExcel failed: " + err.message });
  }
};
