import User from "../models/Users.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../services/mailServices.js";

// ==================== FORGOT PASSWORD =======================
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || email.trim() === "") {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ error: "This email is not registered. Please sign up first." });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        await user.save();

        // Send OTP email
        await sendEmail(
            user.email,
            "Your Password Reset OTP",
            `<div style="font-family: Arial; padding: 20px;">
                <h2>Your OTP Code</h2>
                <p>Your OTP for password reset is:</p>
                <h1 style="color: #4F46E5;">${otp}</h1>
                <p>This OTP is valid for <b>5 minutes</b>.</p>
            </div>`
        );

        return res.json({ message: "OTP has been sent to your registered email." });

    } catch (err) {
        console.error("Forgot Password Error:", err); // Log error to console for debugging
        return res.status(500).json({ error: err.message }); 
    }
};

// ===================== VERIFY OTP ============================
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // 1. Check if email exists
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        // 2. Check if OTP matches
        if (user.otp !== otp)
            return res.status(400).json({ error: "Invalid OTP" });

        // 3. Check if OTP is expired
        if (user.otpExpires < Date.now())
            return res.status(400).json({ error: "OTP has expired" });

        // 4. Success Response
        return res.status(200).json({ message: "OTP verified successfully" });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ====================== RESET PASSWORD =======================
export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ error: "Both new password and confirm password are required." });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match." });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found with this email." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        res.json({ message: "Password successfully reset. Please login again!" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};