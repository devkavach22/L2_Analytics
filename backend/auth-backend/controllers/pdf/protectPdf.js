import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Path for qpdf
const QPDF = process.env.QPDF_PATH || "qpdf";

// Output directory
const OUTPUT_DIR = path.join(process.cwd(), "outputs");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export const protectPdf = (req, res) => {
  // 1. Validation
  if (!req.file) {
    return res.status(400).json({ error: "No PDF uploaded" });
  }

  const inputPdf = req.file.path;
  const password = req.body.password;

  if (!password) {
    // Clean up if validation fails
    try { fs.unlinkSync(inputPdf); } catch (e) {}
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    // 2. Prepare Output Path
    const baseName = path
      .parse(req.file.originalname)
      .name.replace(/[^a-zA-Z0-9-_]/g, "_");
    
    const outputName = `${baseName}_secured_${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    // 3. Construct QPDF Arguments
    // We use an array for arguments to prevent shell injection and handle spaces/special chars safely.
    // Structure: --encrypt user-password owner-password key-length [restrictions] -- input output
    const args = [
      "--encrypt",
      password,      // User Password (needed to open)
      password,      // Owner Password (needed to change permissions - set to same as user so they have full control)
      "256",         // 256-bit AES Encryption (High Security)
      "--print=none",   // Disable printing
      "--modify=none",  // Disable modification
      "--extract=n",    // Disable text/image extraction
      "--annotate=n",   // Disable comments/annotations
      "--",             // End of options separator
      inputPdf,
      outputPath
    ];

    // 4. Execute QPDF safely
    execFile(QPDF, args, (err, stdout, stderr) => {
      // Clean up the uploaded input file immediately
      try {
        if (fs.existsSync(inputPdf)) fs.unlinkSync(inputPdf);
      } catch (e) {
        console.error("Error deleting temp file:", e);
      }

      if (err) {
        console.error("QPDF Error:", stderr);
        // Clean up output if it was partially created
        try {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {}

        return res.status(500).json({
          error: "PDF encryption failed",
          details: stderr || err.message,
        });
      }

      // 5. Success Response
      return res.status(200).json({
        message: "PDF successfully protected",
        file: outputName,
        downloadUrl: `/outputs/${outputName}`,
      });
    });

  } catch (err) {
    // Catch-all for synchronous errors
    try {
      if (fs.existsSync(inputPdf)) fs.unlinkSync(inputPdf);
    } catch (e) {}
    
    return res.status(500).json({ error: "Internal server error" });
  }
};