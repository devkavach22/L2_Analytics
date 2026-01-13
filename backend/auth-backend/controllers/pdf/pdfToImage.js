// controllers/pdf/pdfToImage.js
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import pkg from "uuid";
const { v4: uuid } = pkg;

import {
  OUTPUT_DIR,
  zipFiles,
  removeFiles
} from "../../utils/fileUtils.js";

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

// Extract image script exists?
function checkExtractScript() {
  const script = path.join(process.cwd(), "extract_image.py");
  return fs.existsSync(script);
}

// Run Python image extractor
function runExtractImages(pythonExec, inputPdf, outDir) {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), "extract_image.py");

    execFile(pythonExec, [script, inputPdf, outDir], (err, stdout, stderr) => {
      console.log("extract stdout:", stdout);
      if (err) return reject(stderr || err);
      resolve(true);
    });
  });
}

// Convert PDF pages → JPG using Poppler
function convertUsingPoppler(inputPdf, outPrefix, quality) {
  return new Promise((resolve, reject) => {
    let args = ["-jpeg", inputPdf, outPrefix];

    if (quality === "high") {
      args.push("-r", "300"); // higher DPI
    } else {
      args.push("-r", "150");
    }

    execFile("pdftoppm", args, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export const pdfToImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file)
      return res.status(400).json({ error: "Upload a PDF as 'file'." });

    const mode = req.body.mode || "page_to_jpg";
    const quality = req.body.quality || "normal";

    const base = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9-_]/g, "_");
    const uid = uuid();

    const outputPrefix = path.join(OUTPUT_DIR, `${base}_${uid}`);
    const extractFolder = path.join(OUTPUT_DIR, `${base}_${uid}_extract`);

    fs.mkdirSync(extractFolder, { recursive: true });

    let generatedFiles = [];

    // MODE 1 → PAGE TO JPG
    if (mode === "page_to_jpg") {
      try {
        await convertUsingPoppler(file.path, outputPrefix, quality);
      } catch (err) {
        console.error("Poppler error:", err);
        removeFiles([file.path]);
        return res.status(500).json({ error: "Poppler not installed (pdftoppm missing)." });
      }

      generatedFiles = fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.startsWith(`${base}_${uid}`) && f.endsWith(".jpg"))
        .map(f => path.join(OUTPUT_DIR, f));
    }

    // MODE 2 → EXTRACT EMBEDDED IMAGES
    else if (mode === "extract_images") {
      const pythonExec = await detectPython();
      if (!pythonExec)
        return res.status(500).json({ error: "Python not installed." });

      if (!checkExtractScript())
        return res.status(500).json({ error: "extract_image.py not found." });

      try {
        await runExtractImages(pythonExec, file.path, extractFolder);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Image extraction failed." });
      }

      generatedFiles = fs.readdirSync(extractFolder).map(f => path.join(extractFolder, f));
    }

    // Remove uploaded PDF
    removeFiles([file.path]);

    if (!generatedFiles.length) {
      return res.status(500).json({ error: "No images generated." });
    }

    // If MULTIPLE → ZIP them
    let finalOutput = "";

    if (generatedFiles.length === 1) {
      finalOutput = path.basename(generatedFiles[0]);
    } else {
      const zipName = `${base}_${uid}.zip`;
      finalOutput = zipName;

      await zipFiles(generatedFiles, zipName);
    }

    // Final response like pdfToWord.js
    return res.json({
      message: "PDF to Image conversion completed",
      files: [
        {
          originalName: file.originalname,
          outputFile: `/outputs/${finalOutput}`,
          message: "Conversion successful"
        }
      ]
    });

  } catch (err) {
    console.error("pdfToImage error:", err);
    return res.status(500).json({
      error: "pdfToImage failed: " + err.message
    });
  }
};
