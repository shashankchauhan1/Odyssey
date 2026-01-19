import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const fromEmail = process.env.FROM_EMAIL || `no-reply@${process.env.NEXT_PUBLIC_APP_DOMAIN || 'odyssey.app'}`;

let transporter;
if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port: port || 587,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendInviteEmail(to, { tripId, title }, inviter = {}) {
  if (!transporter) throw new Error('SMTP not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS.');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`;
  const tripLink = `${appUrl}/trip/${tripId}`;
  const inviterText = inviter.email ? `by ${inviter.email}` : '';

  const subject = `You're invited to collaborate on a trip${title ? `: ${title}` : ''}`;
  const text = `You have been invited ${inviterText} to collaborate on a trip.

Open the trip: ${tripLink}

If you don't have an account, sign up to access the trip.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.4">
      <h2>${subject}</h2>
      <p>You have been invited ${inviterText} to collaborate on this trip${title ? `: <strong>${title}</strong>` : ''}.</p>
      <p><a href="${tripLink}" target="_blank" rel="noopener">Open the trip</a></p>
      <p>If you don't have an account, sign up to access the trip.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    text,
    html,
  });

  return info;
}

export default transporter;
