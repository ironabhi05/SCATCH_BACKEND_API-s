'use strict';

const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Generic mail sender leveraging the shared Nodemailer transporter.
 * @param {Object} options
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} [options.html] - HTML body.
 * @param {string} [options.text] - Text body.
 * @param {string} [options.from] - Custom sender string.
 * @returns {Promise<import('nodemailer/lib/smtp-transport').SentMessageInfo>}
 */
const sendMail = async ({ to, subject, html, text, from }) => {
  const mailOptions = {
    from: from || `"SCATCH MART" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to} with subject: ${subject}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.stack || error.message}`);
    throw error;
  }
};

module.exports = {
  sendMail,
  transporter,
};
