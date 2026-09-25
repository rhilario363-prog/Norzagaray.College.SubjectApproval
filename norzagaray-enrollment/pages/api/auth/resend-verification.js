import { prisma } from '../../../lib/prisma';
import { createEmailToken, getPublicAppUrl, hashEmailToken } from '../../../lib/auth';
import { isMailConfigured, sendAccountEmail } from '../../../lib/mail';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const { email } = req.body || {};
  const generic = { message: 'If the account exists, a verification link is ready.' };
  if (!email) return res.status(200).json(generic);
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    if (process.env.NODE_ENV !== 'production') return res.status(404).json({ error: 'No account was found for this Gmail address. Register the account first, or use the same email address used during registration.' });
    return res.status(200).json(generic);
  }
  if (user.emailVerifiedAt) {
    if (process.env.NODE_ENV !== 'production') return res.status(400).json({ error: 'This account is already verified. You can sign in without requesting another link.' });
    return res.status(200).json(generic);
  }
  if (!isMailConfigured() && process.env.NODE_ENV === 'production') return res.status(503).json({ error: 'Email delivery is not configured. Set Gmail SMTP variables first.' });

  const rawToken = createEmailToken();
  await prisma.emailToken.create({ data: { tokenHash: hashEmailToken(rawToken), type: 'EMAIL_VERIFY', userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } });
  const verificationUrl = `${getPublicAppUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;
  if (isMailConfigured()) {
    await sendAccountEmail({ to: user.email, subject: 'Verify your Norzagaray College account', html: `<p>Verify your account by opening <a href="${verificationUrl}">${verificationUrl}</a>.</p><p>This link expires in 24 hours.</p>` });
    return res.status(200).json(process.env.NODE_ENV === 'production' ? generic : { ...generic, message: 'Verification email sent. A development link is also available below.', verificationUrl });
  }
  console.warn(`Development email preview for ${user.email}: ${verificationUrl}`);
  return res.status(200).json({ message: 'Development verification link created. Configure Gmail SMTP before publishing.', verificationUrl });
}
