import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import pkg from "uuid";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js"; // reuse utilities
const { v4: uuid } = pkg;

// Ensure OUTPUT_DIR exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Detect available Python executable
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

// Check if pdf2docx is installed
function checkPdf2Docx(pythonExec) {
  return new Promise((resolve, reject) => {
    execFile(pythonExec, ["-c", "import pdf2docx"], (err) => {
      if (err) return reject(new Error("Python module 'pdf2docx' not installed."));
      resolve(true);
    });
  });
}

// Call Python pdf2docx script
function convertPdfToDocxWithPython(pythonExec, inputPdf, outputDocx) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), "convert_pdf_to_docx.py");
    if (!fs.existsSync(pythonScript)) {
      return reject(new Error("Python script convert_pdf_to_docx.py not found."));
    }

    execFile(pythonExec, [pythonScript, inputPdf, outputDocx], (err, stdout, stderr) => {
      console.log("Python stdout:", stdout);
      console.log("Python stderr:", stderr);
      if (err) return reject(new Error(stderr || err));
      resolve(stdout);
    });
  });
}

export const pdfToWord = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length)
      return res.status(400).json({ error: "Upload PDF(s) in 'files' or 'file'." });

    const pythonExec = await detectPython();
    if (!pythonExec) {
      return res.status(500).json({ error: "Python not found. Install Python 3." });
    }

    try {
      await checkPdf2Docx(pythonExec);
    } catch (err) {
      return res.status(500).json({ error: "Python module 'pdf2docx' is not installed. Run: pip install pdf2docx" });
    }

    const responseData = [];

    for (const f of files) {
      const baseName = path.parse(f.originalname).name.replace(/[^a-zA-Z0-9-_]/g, "_");
      const outName = `${baseName}_${Date.now()}.docx`;
      const outPath = path.join(OUTPUT_DIR, outName);

      try {
        await convertPdfToDocxWithPython(pythonExec, f.path, outPath);

        if (!fs.existsSync(outPath)) {
          throw new Error("DOCX not generated");
        }

        responseData.push({
          originalName: f.originalname,
          outputFile: `/outputs/${outName}`, // <-- public path to download
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
      message: "PDF to Word conversion completed",
      files: responseData
    });

  } catch (err) {
    console.error("pdfToWord error:", err);
    return res.status(500).json({ error: "pdfToWord failed: " + err.message });
  }
};
