import { prisma } from '../../../lib/prisma';
import { createEmailToken, hashEmailToken } from '../../../lib/auth';
import { isMailConfigured, sendAccountEmail } from '../../../lib/mail';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const { email } = req.body || {};
  const generic = { message: 'If that Gmail address is registered, a reset link has been sent.' };
  if (!email) return res.status(200).json(generic);
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  } catch (error) {
    console.error('Password recovery database lookup failed:', error.message);
    return res.status(503).json({ error: 'Password recovery is unavailable because the database connection is not configured.' });
  }
  if (!user) return res.status(200).json(generic);
  if (!isMailConfigured() && process.env.NODE_ENV === 'production') return res.status(503).json({ error: 'Password recovery email is not configured.' });
  const rawToken = createEmailToken();
  await prisma.emailToken.create({ data: { tokenHash: hashEmailToken(rawToken), type: 'PASSWORD_RESET', userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 30) } });
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
  if (isMailConfigured()) {
    try {
      await sendAccountEmail({ to: user.email, subject: 'Reset your Norzagaray College password', html: `<p>Reset your password by opening <a href="${resetUrl}">${resetUrl}</a>.</p><p>This link expires in 30 minutes.</p>` });
    } catch {
      return res.status(503).json({ error: 'Email delivery failed. Please try again later.' });
    }
    return res.status(200).json(generic);
  }
  console.warn(`Development password reset preview for ${user.email}: ${resetUrl}`);
  return res.status(200).json({ message: 'Development reset link created. Configure Gmail SMTP before publishing.', resetUrl });
}
