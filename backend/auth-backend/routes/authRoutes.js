import express from "express";
import { register, login, logout, getUserLinks, viewFile } from "../controllers/authController.js";
import { auth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/roles.js";
import Folder from "../models/Folder.js";
import File from "../models/File.js";
import upload from "../middlewares/upload.js";
import fs, { existsSync } from "fs";
import path from "path";
import { sendToOCR } from "../services/ocrService.js";
import OcrRecord from "../models/OcrRecords.js";
import { analyzeReport } from "../controllers/reportController.js";
import axios from "axios";
import Link from "../models/Link.js";
import pkg from 'uuid';
import { message } from "antd";
const { v4: uuidv4 } = pkg;
// import { viewFile } from "../controllers/authController.js";

const router = express.Router();
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || "./uploads";

console.log("LOCAL_STORAGE_PATH:", LOCAL_STORAGE_PATH);

router.post("/register", register);
router.post("/login", login);

router.get("/admin", auth, authorize("admin"), (req, res) => {
    res.json({ message: "Admin Access Granted!" });
});

router.get("/user", auth, authorize("admin", "user"), (req, res) => {
    res.json({ message: "User Access Granted!" });
});

router.post("/logout", logout);

/* -----------------------------------------------------------
   CREATE FOLDER
----------------------------------------------------------- */
router.post("/folder/create", auth, async (req, res) => {
    try {
        const { name, createdAt, updatedAt, desc,createdBy } = req.body;

        const folder = await Folder.create({
            userId: req.user.id,
            name,
            desc: desc || "",
            createdAt: createdAt || new Date(),
            updatedAt: updatedAt || new Date(),
            createdBy: createdBy || req.user.name
        });

        res.json({ message: "Folder Created", folder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* -----------------------------------------------------------
   GET USER FOLDERS
----------------------------------------------------------- */
router.get("/folders", auth, async (req, res) => {
    try {
        const folders = await Folder.find({ userId: req.user.id });
        res.json({ folders });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* -----------------------------------------------------------
   UPLOAD FILE TO SPECIFIC FOLDER
----------------------------------------------------------- */
router.post("/upload/:folderId", auth, upload.array("files"), async (req, res) => {
    try {
        const folderId = req.params.folderId;

        // 🔹 NEW: extract metadata
        const { documentType, relatedTo } = req.body;

        // 🔹 NEW: enforce mandatory fields
        if (!documentType || !relatedTo) {
            return res.status(400).json({
                error: "documentType and relatedTo are required"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        // User's file storage path
        const userFolderPath = path.join(
            LOCAL_STORAGE_PATH,
            req.user.id.toString(),
            folderId.toString()
        );

        if (!fs.existsSync(userFolderPath)) {
            fs.mkdirSync(userFolderPath, { recursive: true });
        }

        const uploadedFiles = [];
        const ocrRecords = [];

        for (const file of req.files) {
            const finalPath = path.join(userFolderPath, file.filename);

            // Move file from temp upload to final user folder
            fs.renameSync(file.path, finalPath);
            const publicPath = `/workspace/${req.user.id}/${folderId}/${file.filename}`;
            uploadedFiles.push({
                folderId,
                userId: req.user.id,
                url: publicPath,
                originalName: file.originalname,
                storedName: file.filename,
                size: file.size,
                extension: file.originalname.split(".").pop(),
                mimeType: file.mimetype,
                localPath: finalPath,
                // publicPath: `/workspace/${req.user.id}/${folderId}/${file.filename}`,
                publicPath,
                // 🔹 NEW: save metadata
                documentType,
                relatedTo,

                uploadDate: new Date(),
            });
        }

        const savedFiles = await File.insertMany(uploadedFiles);

        savedFiles.forEach((savedFile) => {
            sendToOCR(savedFile.localPath)
                .then(async (ocrText) => {
                    await OcrRecord.create({
                        fileId: savedFile._id,
                        userId: savedFile.userId,
                        folderId: savedFile.folderId,
                        fileName: savedFile.originalName,
                        extractedText: ocrText,
                    });
                    console.log(`OCR saved for file: ${savedFile.originalName}`);
                })
                .catch((err) => {
                    console.error(`OCR failed for file ${savedFile.originalName}:`, err);
                });
        });

        res.status(200).json({
            message: "Files uploaded successfully",
            files: savedFiles,
        });

    } catch (error) {
        console.error("UPLOAD ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});


// router.post("/folder/analyze/:folderId", auth, async (req, res) => {
//     try {
//         console.log("BODY:", req.body);

//         const { folderId } = req.params;
//         const { analyze_text = true, generate_charts = true } = req.body;
//         const userId = req.user.id.toString();

//         if (!req.body) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Request body missing. Ensure JSON middleware is enabled."
//             });
//         }

//         // const { folder_path, analyze_text = true, generate_charts = true } = req.body;
//         // const userId = String(req.user.id);

//         if (!folderId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Folder selection is required"
//             });
//         }

//         const pythonApiUrl = process.env.PYTHON_API_URL;
//         if (!pythonApiUrl) {
//             throw new Error("PYTHON_API_URL not configured");
//         }

//         const folderPath = path.join(
//             LOCAL_STORAGE_PATH,
//             userId,
//             folderId.toString()
//         );

//         if(!fs.existsSync(folderPath))
//         {
//             return res.status(404).json({
//                 success: false,
//                 message: "Folder not found for analysis"
//             });
//         }

//         const pythonResponse = await axios.post(
//             `${pythonApiUrl}/folder/analyze`,
//             {
//                 user_id: userId,
//                 folder_id: folderId,
//                 folder_path: folderPath,
//                 analyze_text,
//                 generate_charts
//             },
//             {
//                 headers: { "Content-Type": "application/json" }
//             }
//         );

//         return res.status(200).json({
//             success: true,
//             data: pythonResponse.data
//         });

//     } catch (error) {
//         console.error("❌ Folder Analyzer Error:", error.message);

//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// });

router.post("/folder/analyze/:folderId", auth, async (req, res) => {
    try {
        console.log("📥 BODY:", req.body);
        console.log("📁 PARAMS:", req.params);

        const { folderId } = req.params;
        // const { analyze_text = true, generate_charts = true } = req.body;

        const userId = req.user.id.toString();

        if (!folderId) {
            return res.status(400).json({
                success: false,
                message: "folderId is required"
            });
        }

        // 🔹 Build folder path (same logic as upload)
        const relativeFolderPath = path.join(
            LOCAL_STORAGE_PATH,
            userId,
            folderId.toString()
        );

        // 🔹 Convert to absolute + normalize for Python
        const absoluteFolderPath = path.resolve(relativeFolderPath);

        console.log("📂 Resolved folder path:", absoluteFolderPath);

        // 🔹 Validate folder existence (Node-side)
        if (!fs.existsSync(absoluteFolderPath)) {
            return res.status(404).json({
                success: false,
                message: "Folder not found for this user"
            });
        }

        const pythonApiUrl = process.env.PYTHON_API_URL;
        if (!pythonApiUrl) {
            throw new Error("PYTHON_API_URL not configured");
        }

        // 🔹 IMPORTANT: normalize slashes for Python
        // const pythonSafePath = absoluteFolderPath.replace(/\\/g, "/");

        // console.log("🐍 Sending folder for analysis:", pythonSafePath);

        const pythonResponse = await axios.post(
            `${pythonApiUrl}/folder/analyze`,
            {
                user_id: userId,
                folder_id: folderId,
                folder_path: absoluteFolderPath, // ✅ REQUIRED
                analyze_text: true,
                generate_charts: true
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        return res.status(200).json({
            success: true,
            data: pythonResponse.data
        });

    } catch (error) {
        console.error("❌ Folder Analyzer Error:", error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: error.response?.data || error.message
        });
    }
});

router.get("/folder/status/:analysisId", auth, async (req, res) => {
    try {
        const { analysisId } = req.params;
        const userId = req.user.id.toString();

        if (!analysisId) {
            return res.status(400).json({
                success: false,
                message: "analysisId is required"
            });
        }

        const pythonApiUrl = process.env.PYTHON_API_URL;
        if (!pythonApiUrl) {
            throw new Error("PYTHON_API_URL not configured");
        }

        console.log("📡 Fetching folder analysis status:", analysisId);

        const pythonResponse = await axios.get(
            `${pythonApiUrl}/folder/status/${analysisId}`,
            {
                params: { user_id: userId } // security layer
            }
        );

        return res.status(200).json({
            success: true,
            data: pythonResponse.data
        });

    } catch (error) {
        console.error("❌ Folder Status Error:", error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: error.response?.data || error.message
        });
    }
});


/* -----------------------------------------------------------
   1. GET ALL FILES (Generic Route FIRST)
----------------------------------------------------------- */
router.get("/files",auth,async(req,res) => {
    try 
    {
        const files = await File.find({ userId: req.user.id}).sort({ uploadDate: -1});
        res.json({ files});
    }
    catch (error)
    {
        res.status(500).json({ error: error.message});
    }
});

/* -----------------------------------------------------------
   GET FILES FROM A FOLDER
----------------------------------------------------------- */
router.get("/files/:folderId", auth, async (req, res) => {
    try {
        
        const files = await File.find({
            folderId: req.params.folderId,
            userId: req.user.id,
        });

        const links = await Link.find({
            folderId: req.params.folderId,
            userId: req.user.id,
        });

        res.json({ files, links });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/* -----------------------------------------------------------
   EXTERNAL LINKS ROUTES (Using Controller)
----------------------------------------------------------- */
// router.post("/link/add",auth,async (req,res) => {
//     try{
//         const {url} = req.body;
//         const userId = req.user.id;

//         if (!url) return res.status(400).json({ error: "URL is required."});

//         console.log(`Processing External Link: ${url}`);

//         const dir = "./uploads/links";

//         if (!fs.existsSync(dir)) fs.makedirSync(dir,{recursive:true});

//         const extension = path.extname(url.split("?")[0]) || ".tmp";
//         const filePath = path.join(dir,`${uuidv4()}${extension}`);

//         const writer = fs.createWriteStream(filePath);
//         const response = await axios({
//             url,
//             method: "GET",
//             responseType: "stream"
//         });
//         response.data.pipe(writer);

//         await new Promise((resolve, reject) => {
//             writer.on("finish", resolve);
//             writer.on("error", reject);
//         });
//         let ocrText = "";
//         try{
//             console.log("Sending download link file to OCR ...");
//             ocrText = await sendToOCR(filePath);
//             console.log("OCR Text extracted from link file.");
//         } catch (err) {
//             console.error("OCR failed for link file:", err);
//             ocrText = "OCR Extraction Failed or Empty";
//         }

//         const newLink = await Link.create({
//             userId,
//             url,
//             extractedText: ocrText,
//             status: "completed"
//         });

//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

//         res.status(200).json({ message: "Link processed successfully", link: newLink });
//     } catch (error) {
//         console.error("Error processing link:", error);
//         res.status(500).json({ error: "Failed to process the link." + error.message });
//     }
// });

router.post("/link/add", auth, async (req, res) => {
    try {
        const { url, folderId } = req.body;
        const userId = String(req.user.id);

        if (!url) return res.status(400).json({ error: "URL is required." });
        if (!folderId) return res.status(400).json({ error: "Folder selection is required." });

        console.log(`🔗 Adding link: ${url} to folder ${folderId}`);
        console.log(`🔗 Processing Link Request: ${url}`);

        // 1. Create Initial Entry in MongoDB (Status: Processing)
        // We save it immediately so the user sees "Processing..." in the UI
        let newLink = await Link.create({
            userId,
            folderId: folderId || null,
            url,
            extractedText: "", // Will be filled if Python returns a summary, or left empty for RAG
            status: "processing"
        });

        // 2. Call Python Service to Ingest & Index (ChromaDB)
        const pythonApiUrl = process.env.PYTHON_API_URL;
        
        if (!pythonApiUrl) {
            throw new Error("PYTHON_API_URL is not defined in .env");
        }

        // We assume Python has an endpoint '/ingest' (see Note below)
        // OR we can use the '/chat' endpoint with a special flag if you prefer
        const pythonResponse = await axios.post(`${pythonApiUrl}/ingest`, {
            user_id: userId,
            url: url
        });

        // 3. Update MongoDB on Success
        if (pythonResponse.data.success) {
            newLink.status = "completed";
            // newLink.extractedText = pythonResponse.data.summary || "Indexed in Vector Store"; 
            await newLink.save();
            
            console.log(`✅ Link processed and indexed for User: ${userId}`);
            res.status(200).json({ 
                success: true,
                message: "Link processed and indexed successfully", 
                link: newLink 
            });
        } else {
            throw new Error(pythonResponse.data.error || "Python service failed to ingest");
        }

    } catch (error) {
        console.error("❌ Error processing link:", error.message);
        
        // Update status to failed if the link was created
        if (req.body.url && req.user && req.folder) {
             await Link.findOneAndUpdate(
                { url: req.body.url, userId: req.user.id, folderId: req.folderId },
                { status: "failed" }
            );
        }

        const errorMessage = error.response?.data?.detail || error.message;
        res.status(500).json({ error: "Failed to process the link. " + errorMessage });
    }
});

router.get("/links",auth,getUserLinks);
/* -----------------------------------------------------------
   ANALYZE & HISTORY ROUTES (Using Controller)
----------------------------------------------------------- */
// Analyze: Supports file upload (single "file") or JSON body keyword
router.post("/report/analyze", auth, upload.single("file"), analyzeReport);
 
// router.post("/chat/ask", auth, async (req, res) => {
//     try {
//         const { question, link } = req.body;
//         const userId = req.user.id;
        
//         // Ensure the Python API URL is configured
//         const pythonApiUrl = process.env.PYTHON_API_URL;
//         if (!pythonApiUrl) {
//             console.error("CRITICAL: PYTHON_API_URL environment variable is missing.");
//             return res.status(500).json({ error: "Internal Server Configuration Error" });
//         }

//         if (!question) return res.status(400).json({ error: "Question is required" });

//         // Forward request to Python FastAPI Service
//         console.log(`💬 Chat Request | User: ${userId} | Link: ${link}`);

//         const response = await axios.post(`${pythonApiUrl}/chat`, {
//             user_id: userId,
//             query: question,
//             link: link || null 
//         });

//         res.json({ answer: response.data.answer });

//     } catch (error) {
//         // Detailed error logging
//         if (error.response) {
//             console.error(`Chat Error [${error.response.status}]:`, error.response.data);
//             res.status(error.response.status).json({ error: error.response.data.detail || "AI Service Error" });
//         } else if (error.request) {
//             console.error("Chat Error: No response from Python service.");
//             res.status(503).json({ error: "AI Service Unavailable" });
//         } else {
//             console.error("Chat Error:", error.message);
//             res.status(500).json({ error: "Internal Server Error" });
//         }
//     }
// });
router.post("/chat/ask", auth, async (req, res) => {
    try {
        // 1. Extract Data
        const { question, link } = req.body;
        
        // Ensure userId is a string to match Python's Pydantic expectation
        const userId = String(req.user.id); 
        
        // 2. Validation
        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

        const pythonApiUrl = process.env.PYTHON_API_URL;
        if (!pythonApiUrl) {
            console.error("CRITICAL: PYTHON_API_URL environment variable is missing.");
            return res.status(500).json({ error: "Internal Server Configuration Error" });
        }

        console.log(`💬 Chat Request | User: ${userId} | Link: ${link ? link : 'Context Only'}`);

        // 3. Forward to Python Service
        // Using a 5-minute timeout is wise for RAG/Video processing
        const response = await axios.post(
            `${pythonApiUrl}/chat`, 
            {
                user_id: userId,   // Explicitly a string
                query: question,   // Correct mapping
                link: link || null // Handles empty link strings properly
            },
            {
                timeout: 300000,
                // Optional: Keep-alive header for long-running RAG tasks
                headers: { 'Connection': 'keep-alive' }
            }
        );

        // 4. Send Response
        res.json({ answer: response.data.answer });

    } catch (error) {
        // ... (Your existing error handling is excellent and should stay as is)
        if (error.code === 'ECONNABORTED') {
            console.error("Chat Error: Request timed out.");
            return res.status(504).json({ error: "The AI took too long to respond. Please try again." });
        }
        if (error.response) {
            // Python service responded with an error (4xx or 5xx)
            console.error(`Chat Error [${error.response.status}]:`, error.response.data);
            res.status(error.response.status).json({ 
                error: error.response.data.detail || "AI Service Error" 
            });
        } else if (error.request) {
            // Python service is down or not reachable
            console.error("Chat Error: No response from Python service.");
            res.status(503).json({ error: "AI Service Unavailable" });
        } else {
            // Internal Node.js error
            console.error("Chat Error:", error.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

router.get("/file/view/:fileId", auth, viewFile);

// History: Get past reports
// router.get("/report/history", auth, getHistory);

export default router;
