// utils/emailTemplates.js

export const otpTemplate = (otp, email) => {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
    <div style="
        max-width: 550px;
        margin: auto;
        background: #ffffff;
        border-radius: 8px;
        padding: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    ">
      
      <h2 style="color: #333; text-align: center;">
        Password Reset OTP
      </h2>

      <p style="font-size: 15px; color: #444;">
        Hello <strong>${email}</strong>,
      </p>

      <p style="font-size: 15px; color: #444;">
        We received a request to reset your password. Use the OTP below to continue:
      </p>

      <div style="
          display: inline-block;
          width: 100%;
          text-align: center;
          background-color: #007bff;
          color: #fff;
          padding: 16px 0;
          margin: 25px 0;
          border-radius: 6px;
          font-size: 32px;
          letter-spacing: 5px;
          font-weight: bold;
      ">
        ${otp}
      </div>

      <p style="font-size: 14px; color: #555;">
        This OTP is valid for the next <strong>5 minutes</strong>.  
        If you did not request this, you can safely ignore this email.
      </p>

      <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;" />

      <p style="font-size: 12px; color: #999; text-align: center;">
        © ${new Date().getFullYear()} Your App Name. All Rights Reserved.
      </p>

    </div>
  </div>
  `;
};
