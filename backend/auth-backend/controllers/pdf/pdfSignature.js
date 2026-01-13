import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import pkg from "uuid";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";

const { v4: uuid } = pkg;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

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

export const pdfSignature = async (req, res) => {
    try {
        // Retrieve uploaded files
        const pdfFile = req.files?.pdf?.[0];
        const signatureFile = req.files?.signature?.[0];

        if (!pdfFile || !signatureFile) {
            return res.status(400).json({
                error: "Both 'pdf' and 'signature' files are required."
            });
        }

        const { pages = "all", position = "bottom-right", scale = "1" } = req.body;

        const pythonExec = await detectPython();
        if (!pythonExec) {
            return res.status(500).json({ error: "Python not found. Install Python 3." });
        }

        // Prepare output path
        const outputName = `signed_${Date.now()}_${uuid()}.pdf`;
        const outputPath = path.join(OUTPUT_DIR, outputName);

        // Path to script
        const pythonScript = path.join(process.cwd(), "pdf_signer.py");

        if (!fs.existsSync(pythonScript)) {
            return res.status(500).json({ error: "Python script pdf_signer.py not found." });
        }

        const args = [
            pythonScript,
            pdfFile.path,
            signatureFile.path,
            outputPath,
            pages,
            position,
            scale
        ];

        // Execute Python script
        execFile(pythonExec, args, (err, stdout, stderr) => {
            console.log("Python stdout:", stdout);
            console.log("Python stderr:", stderr);

            if (err) {
                return res.status(500).json({
                    error: "PDF signing failed",
                    details: stderr || err.message
                });
            }

            if (!fs.existsSync(outputPath)) {
                return res.status(500).json({
                    error: "Signed PDF was not generated."
                });
            }

            // Remove uploaded temp files
            removeFiles([pdfFile.path, signatureFile.path]);

            return res.json({
                message: "PDF signed successfully.",
                file: {
                    originalPdf: pdfFile.originalname,
                    signatureImage: signatureFile.originalname,
                    outputFile: `/outputs/${outputName}`,
                    pages,
                    position,
                    scale,
                }
            });
        });

    } catch (error) {
        console.error("pdfSignature error:", error);
        return res.status(500).json({
            error: "pdfSignature failed: " + error.message
        });
    }
};
