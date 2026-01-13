import User from "../models/Users.js";
import Link from "../models/Link.js";
import File from "../models/File.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
//
import { sendEmail } from "../services/mailServices.js";
import { createDecipheriv } from "crypto";
// import { withSuccess } from "antd/es/modal/confirm.js";

// ====================== REGISTER ===========================
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: "Email already exists." });

        const hashed = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            password: hashed,
            role: role || "user"
        });

        res.json({ message: "User registered successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ========================= LOGIN ===========================
export const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "5h" }
    );

    return res.status(200).json({
        message: "Login Successful",
        id: user._id,
        name: user.name,
        email: user.email,
        token,
    });
};

// ========================= LOGOUT =============================
export const logout = async (req, res) => {
    try {
        return res.json({ message: "Logged out successfully" });
    } catch (err) {
        return res.status(500).json({ error: "Logout Failed!" });
    }
};

// ===================== CHANGE PASSWORD ========================
export const changePassword = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;

        if (!email || !oldPassword || !newPassword) {
            return res.status(400).json({
                error: "Email, old password, and new password are required."
            });
        }

        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ error: "No account found with this email." });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch)
            return res.status(400).json({ error: "Old password is incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
//=========================== Links Add & Get User Link ==========================

export const getUserLinks = async (req, res) => {
    try {
        const userId = req.user.id;
        const folderId = req.query.folderId;

        const query = { userId };
        if (folderId) query.folderId = folderId;
        // const links = await Link.find({userId})
        // .select('url status createdAt extractedText').sort({ createdAt: -1 });

        const links = await Link.find(query)
            .populate({
                path: "folderId",
                select: "name_id"
            })
            .select("url status createdAt extractedText folderId")
            // .select({ createdAt:-1});
        res.json({ 
            success: true,
            // count: links.length,
            links
         });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }   
};
export const viewFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id; 

        // 1. Find file record in DB
        const file = await File.findOne({ _id: fileId, userId });
        if (!file) {
            return res.status(404).json({ error: "File record not found" });
        }

        // 2. Resolve absolute path (Fixes relative path issues)
        let filePath = file.localPath;
        if (!path.isAbsolute(filePath)) {
            // If path is relative (e.g. "uploads/file.pdf"), resolve it against project root
            filePath = path.resolve(process.cwd(), filePath);
        }

        // 3. Check if file exists on disk
        if (fs.existsSync(filePath)) {
            // ✅ SUCCESS: Stream the file
            res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
            res.sendFile(filePath);
        } else {
            // ❌ ERROR: File is missing on disk
            console.error(`[ViewFile] Physical file missing at: ${filePath}`);
            res.status(404).json({ error: "Physical file missing on server. Please delete and re-upload." });
        }
    } catch (err) { 
        console.error("View File Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};