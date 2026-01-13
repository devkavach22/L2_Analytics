import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Make sure the name is always provided
        trim: true      // Removes whitespace from the beginning and end
    },
    email: {
        type: String,
        required: true,
        unique: true,   // Ensure no two users have the same email
        trim: true,
        lowercase: true // Store emails in lowercase
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"], // Only allow 'user' or 'admin'
        default: "user"
    },
    // Your existing fields for password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    otp:String,
    otpExpires:Date,
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

const User = mongoose.model("User", UserSchema);

export default User;