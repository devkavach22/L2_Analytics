// controllers/pdf/downloadGeneratedFile.js
import path from "path";
import fs from "fs";
import { OUTPUT_DIR } from "../../utils/fileUtils.js";

export const downloadGeneratedFile = (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) return res.status(400).json({ error: "filename param required" });

    const full = path.join(OUTPUT_DIR, filename);
    if (!fs.existsSync(full)) return res.status(404).json({ error: "File not found" });

    return res.download(full, filename);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Download failed: " + err.message });
  }
};
