// services/mailService.js

import { Resend } from "resend";
import dotenv from "dotenv";
import { otpTemplate } from "../utils/sendEmail.js";

dotenv.config();

/*
  Required environment variables (.env):

  RESEND_API_KEY=re_*******************
  (You will get this from https://resend.com)
*/

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend API
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} html - HTML content
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const response = await resend.emails.send({
      from: "Support Team <onboarding@resend.dev>", // can customize later
      to,
      subject,
      html,
    });

    console.log("Email sent:", response);
    return response;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send email");
  }
};

/**
 * Sends an OTP email using predefined HTML template
 * @param {string} email - receiver address
 * @param {string|number} otp - OTP value
 */
export const sendOtpEmail = async (email, otp) => {
  try {
    const html = otpTemplate(otp, email);

    await sendEmail(email, "Your OTP for Password Reset", html);
  } catch (error) {
    console.error("OTP Email Error:", error);
    throw error;
  }
};
