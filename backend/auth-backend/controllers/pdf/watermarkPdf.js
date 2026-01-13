// controllers/pdf/watermarkPdf.js
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { OUTPUT_DIR, removeFiles } from "../../utils/fileUtils.js";

/*
SUPPORTED WATERMARK TYPES (like iLovePDF):
------------------------------------------
1️⃣ Text watermark:
    {
        "type": "text",
        "text": "CONFIDENTIAL",
        "fontSize": 60,
        "color": "#FF0000",
        "opacity": 0.2,
        "rotation": -30,
        "position": "center"
    }

2️⃣ Image watermark:
    {
        "type": "image",
        "imageField": "image",
        "width": 300,
        "height": 200,
        "opacity": 0.4,
        "rotation": -15,
        "position": "center"
    }

POSITION VALUES:
- center
- top-left / top-right / bottom-left / bottom-right
*/

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16) / 255,
    g: parseInt(clean.substring(2, 4), 16) / 255,
    b: parseInt(clean.substring(4, 6), 16) / 255,
  };
}

function parsePagesSpec(spec, totalPages) {
  if (!spec || spec === "all") return [...Array(totalPages).keys()];
  if (spec === "odd") return [...Array(totalPages).keys()].filter(i => (i + 1) % 2 === 1);
  if (spec === "even") return [...Array(totalPages).keys()].filter(i => (i + 1) % 2 === 0);

  const pages = new Set();
  const parts = spec.split(",");

  for (const p of parts) {
    if (p.includes("-")) {
      const [s, e] = p.split("-").map(Number);
      for (let i = s; i <= e; i++) pages.add(i - 1);
    } else {
      const num = parseInt(p);
      if (!isNaN(num)) pages.add(num - 1);
    }
  }
  return [...pages];
}

export const watermarkPdf = async (req, res) => {
  const tempFiles = [];

  try {
    const pdfFiles = req.files?.file || req.file;
    const fileList = Array.isArray(pdfFiles) ? pdfFiles : [pdfFiles];

    if (!fileList.length || !fileList[0])
      return res.status(400).json({ files: [], error: "Upload PDF as 'file'." });

    // Get watermark config
    const configBody = req.body.config || req.body.watermark || "{}";
    let config = {};
    try {
      config = typeof configBody === "string" ? JSON.parse(configBody) : configBody;
    } catch {
      config = {};
    }

    if (!config.type)
      return res.status(400).json({ files: [], error: "Specify watermark 'type' (text/image)" });

    const resultFiles = [];

    // Process each PDF
    for (const pdfFile of fileList) {
      if (!pdfFile) continue;
      tempFiles.push(pdfFile.path);

      const pdfBytes = fs.readFileSync(pdfFile.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const totalPages = pdfDoc.getPageCount();
      const pageIndices = parsePagesSpec(config.pages || "all", totalPages);

      // TEXT WATERMARK SETUP
      let font = null;
      if (config.type === "text") {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      // IMAGE WATERMARK SETUP
      let embeddedImg = null;
      let imgWidth = 0,
        imgHeight = 0;

      if (config.type === "image") {
        const field = config.imageField || "image";

        if (!req.files || !req.files[field]) {
          return res.status(400).json({
            files: [],
            error: `Upload watermark image using field '${field}'`,
          });
        }

        const imgFile = req.files[field][0];
        tempFiles.push(imgFile.path);

        const imgBuffer = fs.readFileSync(imgFile.path);
        const pngBuffer = await sharp(imgBuffer).png().toBuffer();
        embeddedImg = await pdfDoc.embedPng(pngBuffer);
        imgWidth = config.width || embeddedImg.width;
        imgHeight = config.height || embeddedImg.height;
      }

      // Apply watermark to pages
      for (const idx of pageIndices) {
        const page = pdfDoc.getPage(idx);
        const { width, height } = page.getSize();
        const margin = Number(config.margin || 20);

        let x = 0,
          y = 0;

        const position = config.position || "center";

        // Position logic
        if (config.type === "text") {
          const fontSize = Number(config.fontSize || 50);
          const text = config.text || "Watermark";
          const textWidth = font.widthOfTextAtSize(text, fontSize);

          switch (position) {
            case "top-left":
              x = margin;
              y = height - margin;
              break;
            case "top-right":
              x = width - textWidth - margin;
              y = height - margin;
              break;
            case "bottom-left":
              x = margin;
              y = margin + fontSize;
              break;
            case "bottom-right":
              x = width - textWidth - margin;
              y = margin + fontSize;
              break;
            default:
              x = (width - textWidth) / 2;
              y = height / 2;
          }

          const { r, g, b } = hexToRgb(config.color || "#000000");

          page.drawText(text, {
            x,
            y,
            size: fontSize,
            color: rgb(r, g, b),
            opacity: Number(config.opacity ?? 0.15),
            rotate: degrees(Number(config.rotation || -45)),
            font,
          });
        }

        if (config.type === "image") {
          switch (position) {
            case "top-left":
              x = margin;
              y = height - imgHeight - margin;
              break;
            case "top-right":
              x = width - imgWidth - margin;
              y = height - imgHeight - margin;
              break;
            case "bottom-left":
              x = margin;
              y = margin;
              break;
            case "bottom-right":
              x = width - imgWidth - margin;
              y = margin;
              break;
            default:
              x = (width - imgWidth) / 2;
              y = (height - imgHeight) / 2;
          }

          page.drawImage(embeddedImg, {
            x,
            y,
            width: imgWidth,
            height: imgHeight,
            opacity: Number(config.opacity ?? 0.2),
            rotate: degrees(Number(config.rotation || 0)),
          });
        }
      }

      const outName = `${path.parse(pdfFile.originalname).name}_watermarked_${Date.now()}.pdf`;
      const outPath = path.join(OUTPUT_DIR, outName);

      const outBytes = await pdfDoc.save();
      fs.writeFileSync(outPath, outBytes);

      resultFiles.push({
        outputFile: `/outputs/${outName}`,
        status: "success",
        message: "Watermark applied successfully",
      });
    }

    removeFiles(tempFiles);
    return res.json({ files: resultFiles });
  } catch (err) {
    console.error("watermarkPdf error:", err);
    removeFiles(tempFiles);
    return res.status(500).json({
      files: [],
      error: err.message || "Watermark failed.",
    });
  }
};
