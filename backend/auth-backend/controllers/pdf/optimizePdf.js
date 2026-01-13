import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";

// Ensure OUTPUT_DIR exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ---------------------------
// Detect Python executable
// ---------------------------
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

// ---------------------------
// Run Python optimize_pdf.py with full logging
// ---------------------------
function runOptimizePdf(pythonExec, inputPdf, outputPdf, options) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "optimize_pdf.py");
    if (!fs.existsSync(scriptPath))
      return reject(new Error("Python script optimize_pdf.py not found"));

    execFile(pythonExec, [scriptPath, inputPdf, outputPdf, options], (err, stdout, stderr) => {
      console.log("Python stdout:", stdout);
      console.log("Python stderr:", stderr);

      if (err) {
        return reject({
          message: "Python script failed",
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      }

      resolve(stdout);
    });
  });
}

// ---------------------------
// Normalize frontend options
// ---------------------------
function normalizeOptions(options) {
  const mapping = {
    "remove metadata": "remove_metadata",
    "image compression": "image_compression",
    "remove unused objects": "remove_unused_objects",
    "flatten forms": "flatten_forms",
    "remove bookmarks": "remove_bookmarks",
    "optimize transparency": "optimize_transparency",
    "secure optimization": "secure_optimization",
    "archival (pdf/a)": "archival_(pdf/a)"
  };

  return options
    .map(opt => mapping[opt.toLowerCase()] || null)
    .filter(Boolean);
}

// ---------------------------
// Main API handler
// ---------------------------
export const optimizePdf = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length)
      return res.status(400).json({ error: "Upload PDF(s) in 'files' or 'file'." });

    const pythonExec = await detectPython();
    if (!pythonExec)
      return res.status(500).json({ error: "Python not found. Install Python 3." });

    const level = req.body.level || "recommended";

    // Handle options passed as array or string
    let optionsFromFront = req.body.options || [];
    if (typeof optionsFromFront === "string") {
      try {
        optionsFromFront = JSON.parse(optionsFromFront);
        if (!Array.isArray(optionsFromFront)) optionsFromFront = [];
      } catch {
        optionsFromFront = optionsFromFront.split(",");
      }
    }

    const normalizedOptions = normalizeOptions(optionsFromFront);
    const pythonOptions = [...normalizedOptions, `level:${level}`].join(",");

    const responseData = [];

    for (const f of files) {
      const baseName = path.parse(f.originalname).name.replace(/[^a-zA-Z0-9-_]/g, "_");
      const outName = `${baseName}_optimized_${Date.now()}.pdf`;
      const outPath = path.join(OUTPUT_DIR, outName);

      try {
        await runOptimizePdf(pythonExec, f.path, outPath, pythonOptions);

        if (!fs.existsSync(outPath)) throw new Error("Optimized PDF not generated");

        responseData.push({
          originalName: f.originalname,
          outputFile: `/outputs/${outName}`,
          message: "Optimization successful",
          pythonStdout: "",    // empty because success
          pythonStderr: ""
        });

        removeFiles([f.path]);

      } catch (err) {
        responseData.push({
          originalName: f.originalname,
          outputFile: null,
          message: "Optimization failed",
          error: err.message || err,
          pythonStdout: err.stdout || "",
          pythonStderr: err.stderr || ""
        });
      }
    }

    return res.json({
      message: "PDF optimization completed",
      files: responseData
    });

  } catch (err) {
    console.error("optimizePdf error:", err);
    return res.status(500).json({ error: "optimizePdf failed: " + err.message });
  }
};
