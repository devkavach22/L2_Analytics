import fs from "fs";
import path from "path";
import os from "os";
import textract from "textract";
import Tesseract from "tesseract.js";
import mammoth from "mammoth";
import * as pdfParse from "pdf-parse";
import { fromPath } from "pdf2pic";
import sharp from "sharp";

// -------------------------------------------------------------
// Image Preprocessing - Enhances OCR accuracy for Resume scans
// -------------------------------------------------------------
const preprocessImage = async (buffer) => {
    try {
        return await sharp(buffer)
            .grayscale() // Convert to B&W
            .normalize() // Stretch contrast
            .sharpen()   // Sharpen text edges
            .toBuffer();
    } catch (err) {
        console.error("Image preprocessing warning:", err.message);
        return buffer; // Return original if sharp fails
    }
};

// -------------------------------------------------------------
// OCR Helper: Process a single image buffer
// -------------------------------------------------------------
const ocrImage = async (buffer, retries = 2) => {
    try {
        const processed = await preprocessImage(buffer);
        const result = await Tesseract.recognize(processed, "eng", {
            logger: () => {}, // Silence Tesseract logs
        });
        return result?.data?.text?.trim() || "";
    } catch (err) {
        if (retries > 0) {
            console.warn(`OCR retry (${retries} left)...`);
            return await ocrImage(buffer, retries - 1);
        }
        console.error("OCR Final Error:", err.message);
        return "";
    }
};

// -------------------------------------------------------------
// PDF Page Converter: PDF -> Images -> Text
// -------------------------------------------------------------
const ocrPdfPages = async (filePath, totalPages) => {
    let fullText = "";
    
    // 1. Setup save directory in system temp folder (avoids permission errors)
    const saveDir = os.tmpdir();
    const baseName = `ocr-${Date.now()}`;

    const options = {
        density: 300,           // High DPI for better OCR
        saveFilename: baseName,
        savePath: saveDir,
        format: "png",
        width: 2480,            // A4 width at 300 DPI
        height: 3508
    };

    try {
        const converter = fromPath(filePath, options);
        
        // Loop through all pages
        for (let page = 1; page <= totalPages; page++) {
            try {
                // Convert PDF page to Image
                const pageResult = await converter(page, { responseType: "image" });
                
                if (pageResult && pageResult.path) {
                    const imageBuffer = fs.readFileSync(pageResult.path);
                    
                    // Perform OCR on the image
                    const pageText = await ocrImage(imageBuffer);
                    fullText += `--- PAGE ${page} ---\n${pageText}\n\n`;

                    // Cleanup: Delete temp image immediately
                    fs.unlinkSync(pageResult.path);
                }
            } catch (pageErr) {
                console.error(`Error processing page ${page}:`, pageErr.message);
            }
        }
    } catch (err) {
        console.error("PDF-to-Image conversion setup failed:", err.message);
    }

    return fullText.trim();
};

// -------------------------------------------------------------
// Intelligent PDF Extractor
// -------------------------------------------------------------
const extractPdf = async (filePath) => {
    let pdfData = { text: "", numpages: 1 };

    // Step 1: Try Native Text Extraction (Fast)
    // Works for digital resumes (generated from Word/Canva)
    try {
        const dataBuffer = fs.readFileSync(filePath);
        pdfData = await pdfParse(dataBuffer);
    } catch (err) {
        console.warn("Native PDF parsing failed, switching to OCR mode.");
    }

    // Validation: If text exists and looks valid (not just garbage characters)
    // We check for > 50 characters to rule out empty scanned pages that contain hidden metadata
    const cleanText = pdfData.text ? pdfData.text.trim() : "";
    
    if (cleanText.length > 50) {
        // Return native text if found
        return cleanText;
    }

    // Step 2: Fallback to OCR (Slow but Powerful)
    // Works for Scanned PDFs, Images saved as PDF, or "Print to PDF" files
    console.log("No text layer found. Starting OCR extraction...");
    return await ocrPdfPages(filePath, pdfData.numpages || 1);
};

// -------------------------------------------------------------
// Excel Extraction
// -------------------------------------------------------------
const extractExcelText = async (filePath) => {
    return new Promise((resolve) => {
        textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (err, text) => {
            if (err) {
                console.error("Excel extract error:", err.message);
                resolve("");
            } else {
                resolve(text || "");
            }
        });
    });
};

// -------------------------------------------------------------
// UNIVERSAL EXTRACTOR (Main Function)
// -------------------------------------------------------------
export const extractTextUsingOCR = async (filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();

        // 1. Simple Text Formats
        if ([".txt", ".csv", ".log", ".sql", ".json"].includes(ext)) {
            const content = fs.readFileSync(filePath, "utf-8");
            return ext === ".json" ? JSON.stringify(JSON.parse(content), null, 2) : content;
        }

        // 2. Word Documents
        if (ext === ".docx") {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }

        // 3. Excel Spreadsheets
        if ([".xls", ".xlsx"].includes(ext)) {
            return await extractExcelText(filePath);
        }

        // 4. Images (JPG, PNG, etc.)
        if ([".jpg", ".jpeg", ".png", ".bmp", ".webp"].includes(ext)) {
            const buffer = fs.readFileSync(filePath);
            return await ocrImage(buffer, 3);
        }

        // 5. PDFs (Digital & Scanned)
        if (ext === ".pdf") {
            return await extractPdf(filePath);
        }

        // 6. Fallback for unknown types
        return new Promise((resolve) => {
            textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (err, text) => {
                resolve(err ? "" : text || "");
            });
        });

    } catch (err) {
        console.error("Universal Extractor Error:", err.message);
        return "";
    }
};