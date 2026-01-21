// controllers/pdf/wordToPdf.js
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";

function runLibreConvert(inputPath, outputDir, outExt) {
  return new Promise((resolve, reject) => {
    const candidates = ["soffice", "libreoffice"];
    let idx = 0;

    const tryExec = () => {
      const cmd = candidates[idx];
      const args = ["--headless", "--convert-to", outExt, "--outdir", outputDir, inputPath];

      execFile(cmd, args, (err) => {
        if (!err) return resolve();
        idx++;
        if (idx >= candidates.length) return reject(err);
        tryExec();
      });
    };

    tryExec();
  });
}

export const wordToPdf = async (req, res) => {
  try {
    let file = req.file;

    // allow both: "file" and "files"
    if (!file && req.files && req.files.length > 0) {
      file = req.files[0];
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Upload Word file as 'file' (or 'files')."
      });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (![".doc", ".docx"].includes(ext)) {
      removeFiles([file.path]);
      return res.status(400).json({ 
        success: false,
        error: "Only .doc / .docx files are allowed." 
      });
    }

    const base = path.parse(file.originalname).name;
    const uniqueName = `${base}_${Date.now()}.pdf`;
    const outPath = path.join(OUTPUT_DIR, uniqueName);

    try {
      await runLibreConvert(file.path, OUTPUT_DIR, "pdf");
    } catch (err) {
      removeFiles([file.path]);
      console.error("LibreOffice convert error:", err);
      return res.status(500).json({
        success: false,
        error: "Conversion failed. Ensure LibreOffice is installed."
      });
    }

    // find converted pdf
    const pdfs = fs.readdirSync(OUTPUT_DIR)
      .filter(f => f.endsWith(".pdf"))
      .map(f => path.join(OUTPUT_DIR, f));

    if (pdfs.length === 0) {
      removeFiles([file.path]);
      return res.status(500).json({
        success: false,
        error: "Conversion completed but no PDF found."
      });
    }

    // newest file
    pdfs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    const generatedPdf = pdfs[0];

    // rename to unique file name
    fs.renameSync(generatedPdf, outPath);

    removeFiles([file.path]);

    const fileName = path.basename(outPath);

    return res.json({
      success: true,
      message: "Word successfully converted to PDF.",
      fileName: fileName,
      downloadUrl: `/outputs/${fileName}`
    });

  } catch (err) {
    console.error("wordToPdf failed:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error"
    });
  }
};
