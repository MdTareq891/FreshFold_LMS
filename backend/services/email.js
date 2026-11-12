const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn("[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — emails will be skipped.");
    return null;
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t || !to) return { skipped: true };
  try {
    await t.sendMail({
      from: `"FreshFold Laundry" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendEmail };
