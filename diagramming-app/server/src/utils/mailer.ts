import dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_ADDRESS = process.env.MAIL_FROM || 'no-reply@example.com';

export async function sendInviteEmail(to: string, inviteLink: string, inviter?: string) {
  const subject = 'You have been invited to view a diagram';
  const text = `You have been invited by ${inviter || 'someone'} to view a diagram. Click the link to accept: ${inviteLink}`;
  const html = `<p>You have been invited by ${inviter || 'someone'} to view a diagram.</p><p><a href="${inviteLink}">Accept invitation</a></p>`;

  if (SMTP_HOST && SMTP_PORT) {
    try {
      // Load nodemailer at runtime if available
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined });
      await transporter.sendMail({ from: FROM_ADDRESS, to, subject, text, html });
      return { ok: true };
    } catch (e) {
      console.error('Failed to send invite email (nodemailer may be missing or SMTP failed)', e);
      // fall back to logging
    }
  }

  // Fallback: log invite link for development
  console.log(`Invite for ${to}: ${inviteLink}`);
  return { ok: true, fallback: true };
}
