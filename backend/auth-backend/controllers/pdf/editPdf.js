import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";
import pkg from "uuid";
const { v4: uuid } = pkg;

// Ensure output folder exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Detect Python
function detectPython() {
  return new Promise((resolve) => {
    execFile("python3", ["--version"], (err) => {
      if (!err) return resolve("python3");
      execFile("python", ["--version"], (err2) => {
        if (!err2) return resolve("python");
        resolve(null);
      });
    });
  });
}

// Run Python edit script
function runPdfEditPython(pythonExec, inputPdf, edits, outputPdf) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), "edit_pdf.py");

    if (!fs.existsSync(pythonScript)) {
      return reject(new Error("edit_pdf.py not found in project root folder"));
    }

    execFile(
      pythonExec,
      [pythonScript, inputPdf, JSON.stringify(edits), outputPdf],
      (err, stdout, stderr) => {
        console.log("Python stdout:", stdout);
        console.log("Python stderr:", stderr);

        if (err) return reject(new Error(stderr || err));
        resolve(stdout);
      }
    );
  });
}

export const editPdf = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length)
      return res.status(400).json({ error: "Upload PDF(s) using field 'files' or 'file'." });

    const edits = JSON.parse(req.body.edits || "[]");

    const pythonExec = await detectPython();
    if (!pythonExec) {
      return res.status(500).json({ error: "Python not found. Install Python 3." });
    }

    const responseData = [];

    for (const file of files) {
      const baseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9-_]/g, "_");
      const outputName = `${baseName}_edited_${Date.now()}.pdf`;
      const outputPath = path.join(OUTPUT_DIR, outputName);

      try {
        await runPdfEditPython(pythonExec, file.path, edits, outputPath);

        if (!fs.existsSync(outputPath)) {
          throw new Error("Edited PDF not generated");
        }

        responseData.push({
          originalName: file.originalname,
          outputFile: `/outputs/${outputName}`, // for frontend access
          message: "Edit successful"
        });

        // Delete original uploaded file
        removeFiles([file.path]);

      } catch (err) {
        responseData.push({
          originalName: file.originalname,
          outputFile: null,
          message: "Edit failed",
          error: err.message
        });
      }
    }

    return res.json({
      message: "PDF Editing Completed",
      files: responseData,
    });

  } catch (err) {
    console.error("editPdf error:", err);
    return res.status(500).json({ error: "PDF editing failed: " + err.message });
  }
};
