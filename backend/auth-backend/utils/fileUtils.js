// utils/fileUtils.js
import fs from "fs";
import path from "path";
import archiver from "archiver";

export const OUTPUT_DIR = path.join(process.cwd(), "outputs");
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// create zip from array of file paths, returns zip path
export function zipFiles(filePaths = [], zipName = `files_${Date.now()}.zip`) {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(OUTPUT_DIR, zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    archive.on("error", err => reject(err));

    archive.pipe(output);

    filePaths.forEach(fp => {
      const base = path.basename(fp);
      archive.file(fp, { name: base });
    });

    archive.finalize();
  });
}

// helper to remove files (array of paths)
export function removeFiles(paths = []) {
  paths.forEach(p => {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (err) {
      // ignore
      console.warn("Failed to remove", p, err.message);
    }
  });
}

// helper to stream file as download (used in controllers)
export function downloadFile(res, filePath, downloadName) {
  return res.download(filePath, downloadName, err => {
    // caller handles cleanup if needed
    if (err) console.error("Error while downloading:", err);
  });
}
