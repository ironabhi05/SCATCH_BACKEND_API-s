const nodemailer = require("nodemailer");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const sendMail = async (type, to, otp = null) => {
  let subject, html;

  switch (type) {
    case "welcome":
      subject = "Welcome to SCATCH MART!";
      html = `
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: #f4f6f8;
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #F2F4F7;
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.08);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #00A2FD, #78c9f8);
                color: #fff;
                text-align: center;
                padding: 24px;
              }
              .header h1 {
                margin: 0;
                font-size: 26px;
              }
              .content {
                padding: 24px;
                text-align: left;
              }
              .content p {
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 16px;
              }
              .footer {
                text-align: center;
                font-size: 13px;
                color: #777;
                padding: 16px;
                background-color: #CEDEF7;
              }
              .cta-button {
                display: inline-block;
                background-color: #571588 ;
                color: white;
                padding: 10px 20px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to SCATCH MART 🎉</h1>
              </div>
              <div class="content">
                <p>Dear Scatch Mart User,</p>
                <p>We’re thrilled to have you join <b>SCATCH MART</b> — your one-stop destination for quality shopping and unbeatable deals.</p>
                <p>Start exploring our latest collections and exciting offers now.</p>
                <p style="text-align:center;">
                  <a href="https://scatch-mart.netlify.app/" class="cta-button">Visit SCATCH MART</a>
                </p>
                <p>Stay tuned for exclusive offers, product updates, and a smoother shopping experience!</p>
                <p style="color:black;">— The SCATCH MART Team</p>
              </div>
              <div class="footer">
                <p>You received this email because you joined SCATCH MART.</p>
                <p>© ${new Date().getFullYear()} SCATCH MART. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      break;

    case "otp_reset":
      subject = "Your OTP for Password Reset";
      html = `
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: #f4f6f8;
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #F2F4F7;
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.08);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #00A2FD, #78c9f8);
                color: #fff;
                text-align: center;
                padding: 24px;
              }
              .content {
                padding: 24px;
                text-align: center;
              }
              .otp-box {
                font-size: 18px;
                font-weight: bold;
                color: #0277bd;
                display: inline-block;
                letter-spacing: 2px;
              }
              .footer {
                text-align: center;
                font-size: 13px;
                color: #777;
                padding: 16px;
                background-color: #CEDEF7;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Password Reset Request</h2>
              </div>
              <div class="content">
                <p>Dear Scatch Mart User,</p>
                <p>Use the OTP below to reset your password:</p>
                <div class="otp-box">${otp}</div>
                <p>This OTP is valid for <b>2 minutes</b>. Do not share it with anyone.</p>
                <p>If you didn’t request a password reset, you can safely ignore this message.</p>
              </div>
              <div class="footer">
                <p>For help, contact us at support@scatchmart.com</p>
              </div>
            </div>
          </body>
        </html>
      `;
      break;

    case "password_changed":
      subject = "Password Changed Successfully";
      html = `
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: #f4f6f8;
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.08);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #00A2FD, #78c9f8);
                color: #fff;
                text-align: center;
                padding: 24px;
              }
              .content {
                padding: 24px;
                text-align: left;
              }
              .content p {
                font-size: 16px;
                line-height: 1.6;
              }
              .cta-button 
              {
                display: inline-block;
                background-color: #8e24aa;
                color: white !important;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: bold;
                margin: 10px 0;
              }
              .cta-button:hover
              {
                background-color: #7b1fa2;
              }
              .footer 
              {
                text-align: center;
                font-size: 13px;
                color: #777;
                padding: 16px;
                background-color: #CEDEF7;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Password Changed Successfully</h2>
              </div>
              <div class="content">
                <p>Dear <b>ScatchMart User</b>,</p>
            <p>Your SCATCH MART account password was changed successfully.</p>
            <p>If this wasn’t you, please <b>reset your password immediately</b> or contact our support team for assistance.</p>
            <p>We recommend using a strong and unique password for your account security.</p>
            <p>Stay tuned for exclusive offers, product updates, and a smoother shopping experience!</p>
            <div style="text-align:center; margin-top: 24px;">
              <a href="https://scatch-mart.netlify.app/login" class="cta-button">Login to Your Account</a>
            </div>
              </div>
              <div class="footer">
                <p>Stay secure — The SCATCH MART Team</p>
              </div>
            </div>
          </body>
        </html>
      `;
      break;

    default:
      logger.error(`Unknown email type: ${type}`);
      throw new Error(`Unknown email type: ${type}`);
  }

  try {
    await transporter.sendMail({
      from: '"SCATCH MART" <abhinavmisha04@gmail.com>',
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error("There was an error to sending Mail", error);
    throw error;
  }
};

module.exports = { sendMail, transporter };
