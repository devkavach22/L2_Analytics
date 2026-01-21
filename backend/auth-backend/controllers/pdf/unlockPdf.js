import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";

// Ensure OUTPUT_DIR exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * runQpdfDecrypt
 * Wraps qpdf execution in a promise.
 * Rejects with detailed info if qpdf fails (e.g., wrong password).
 */
function runQpdfDecrypt(inputPath, outputPath, password = null) {
  return new Promise((resolve, reject) => {
    const qpdf = "qpdf";
    const args = ["--decrypt"];

    if (password) {
      args.push(`--password=${password}`);
    }

    args.push(inputPath, outputPath);

    execFile(qpdf, args, (err, stdout, stderr) => {
      if (err) {
        // Reject with the specific stderr message so we can detect "invalid password"
        return reject({ 
          code: err.code, 
          message: err.message, 
          stderr: stderr 
        });
      }
      resolve(outputPath);
    });
  });
}

export const unlockPdf = async (req, res) => {
  try {
    // 1. Handle Multiple Files (matching pdfToWord logic)
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) {
      return res.status(400).json({ error: "Upload PDF(s) in 'files' or 'file'." });
    }

    const userPassword = req.body.password || null;
    const responseData = [];

    // 2. Iterate through all uploaded files
    for (const f of files) {
      const baseName = path.parse(f.originalname).name.replace(/[^a-zA-Z0-9-_]/g, "_");
      const outName = `${baseName}_unlocked_${Date.now()}.pdf`;
      const outPath = path.join(OUTPUT_DIR, outName);

      try {
        // --- ATTEMPT 1: Auto-Unlock (No Password) ---
        // Best for "Owner Locked" files (print/copy restrictions only)
        await runQpdfDecrypt(f.path, outPath, null);

        // Success: Add to response list
        responseData.push({
          originalName: f.originalname,
          outputFile: `/outputs/${outName}`, // Public download path
          message: "Unlock successful (Permissions removed)",
          status: "success"
        });

      } catch (firstErr) {
        // --- ATTEMPT 1 FAILED ---
        const isEncryptedError = firstErr.stderr && firstErr.stderr.includes("invalid password");

        // Case A: File is encrypted, but NO password provided by user
        if (isEncryptedError && !userPassword) {
          responseData.push({
            originalName: f.originalname,
            outputFile: null,
            message: "File is encrypted. Password required.",
            isEncrypted: true, // Flag for frontend to show password input
            status: "failed"
          });
        }
        // Case B: File is encrypted, AND user provided a password
        else if (isEncryptedError && userPassword) {
          try {
            // --- ATTEMPT 2: Unlock with User Password ---
            await runQpdfDecrypt(f.path, outPath, userPassword);

            responseData.push({
              originalName: f.originalname,
              outputFile: `/outputs/${outName}`,
              message: "Unlock successful (Password verified)",
              status: "success"
            });
          } catch (secondErr) {
            // --- ATTEMPT 2 FAILED (Wrong Password) ---
            responseData.push({
              originalName: f.originalname,
              outputFile: null,
              message: "Incorrect password.",
              code: "INVALID_PASSWORD",
              status: "failed"
            });
          }
        } 
        // Case C: Other system errors (not password related)
        else {
          responseData.push({
            originalName: f.originalname,
            outputFile: null,
            message: "Processing failed",
            error: firstErr.stderr || firstErr.message,
            status: "error"
          });
        }
      } finally {
        // Clean up the uploaded temp file
        removeFiles([f.path]);
      }
    }

    // 3. Return JSON response (matching pdfToWord structure)
    return res.json({
      message: "PDF unlock processing completed",
      files: responseData
    });

  } catch (err) {
    console.error("unlockPdf critical error:", err);
    return res.status(500).json({ error: "unlockPdf failed: " + err.message });
  }
};