import nodemailer from 'nodemailer';

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD));
}

function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
  }
  return nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
}

export async function sendAccountEmail({ to, subject, html }) {
  if (!isMailConfigured()) throw new Error('Email delivery is not configured.');
  return getTransporter().sendMail({ from: process.env.MAIL_FROM || process.env.GMAIL_USER || process.env.SMTP_USER, to, subject, html });
}
