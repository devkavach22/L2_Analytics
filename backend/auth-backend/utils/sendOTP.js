import { sendEmail } from "./sendEmail.js";

export const sendOTPEmail = async (email, otp) => {
    const subject = "Your OTP Code for Password Reset";
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Your OTP Code</h2>
        <p>Use the OTP below to reset your password:</p>

        <h1 style="background: #f6f6f6; padding: 10px 15px; letter-spacing: 5px; 
                   width: max-content; border-radius: 5px;">
            ${otp}
        </h1>

        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br>
        <small>Auth System</small>
      </div>
    `;

    await sendEmail(email, subject, html);
};
