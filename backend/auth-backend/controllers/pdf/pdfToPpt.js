// controllers/pdf/pdfToPpt.js
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function runLibreOffice(inputPdf, outputDir) {
  return new Promise((resolve, reject) => {
    const commands = ["soffice", "libreoffice"];
    let index = 0;

    const tryExec = () => {
      if (index >= commands.length)
        return reject(new Error("LibreOffice not found in PATH"));

      const cmd = commands[index];
      const args = [
        "--headless",
        "--convert-to", "pptx",
        "--outdir", outputDir,
        inputPdf
      ];

      execFile(cmd, args, (err, stdout, stderr) => {
        if (!err) return resolve({ stdout, stderr });
        index++;
        tryExec();
      });
    };

    tryExec();
  });
}

export const pdfToPpt = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length)
      return res.status(400).json({ error: "Upload PDF(s) using 'file' or 'files'." });

    const results = [];

    for (const f of files) {
      const base = path.parse(f.originalname).name.replace(/[^a-zA-Z0-9-_]/g, "_");

      try {
        await runLibreOffice(f.path, OUTPUT_DIR);

        // Try exact match
        let outputFile = path.join(OUTPUT_DIR, `${base}.pptx`);

        // If not found, find latest pptx
        if (!fs.existsSync(outputFile)) {
          const pptFiles = fs.readdirSync(OUTPUT_DIR)
            .filter(n => n.endsWith(".pptx"))
            .map(n => path.join(OUTPUT_DIR, n));

          if (!pptFiles.length)
            throw new Error("Converted PPTX not found.");

          pptFiles.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
          outputFile = pptFiles[0];
        }

        const finalName = `${base}_${Date.now()}.pptx`;
        const finalPath = path.join(OUTPUT_DIR, finalName);

        fs.renameSync(outputFile, finalPath);

        results.push({
          originalName: f.originalname,
          outputFile: `/outputs/${finalName}`,
          message: "PDF converted to PPTX successfully"
        });

      } catch (err) {
        results.push({
          originalName: f.originalname,
          outputFile: null,
          message: "Conversion failed",
          error: err.message
        });
      }

      removeFiles([f.path]);
    }

    return res.json({
      message: "PDF → PPTX conversion completed",
      files: results
    });

  } catch (err) {
    console.error("pdfToPpt error:", err);
    return res.status(500).json({
      error: "pdfToPpt failed: " + err.message
    });
  }
};
