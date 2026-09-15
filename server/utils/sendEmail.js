const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error("SMTP chưa được cấu hình");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") !== "false",
    auth: { user, pass },
    connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM || `"SkillHub" <${user}>`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = sendEmail;
