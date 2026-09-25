import { prisma } from '../../../lib/prisma';
import { createEmailToken, getPublicAppUrl, hashEmailToken, hashPassword, readSession, verifyPassword } from '../../../lib/auth';
import { isMailConfigured, sendAccountEmail } from '../../../lib/mail';

function getNameParts(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '', lastName: parts.length > 1 ? parts[parts.length - 1] : '' };
}

export default async function handler(req, res) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated.' });

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, username: true, email: true, name: true, role: true, department: true, program: true } });
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });
    return res.status(200).json({ user: { ...user, ...getNameParts(user.name) } });
  }

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed.' });
  const { firstName, middleName, lastName, email, currentPassword, newPassword } = req.body || {};
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) return res.status(400).json({ error: 'First name, last name, and email are required.' });
  if (!/^\S+@gmail\.com$/i.test(email.trim())) return res.status(400).json({ error: 'Use a valid Gmail address.' });
  const existingUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, passwordHash: true } });
  if (!existingUser) return res.status(401).json({ error: 'Not authenticated.' });
  const normalizedEmail = email.trim().toLowerCase();
  const emailChanged = normalizedEmail !== existingUser.email;
  if (emailChanged && !isMailConfigured() && process.env.NODE_ENV === 'production') return res.status(503).json({ error: 'Email delivery is not configured, so your Gmail cannot be changed yet.' });
  if (newPassword && (!currentPassword || !verifyPassword(currentPassword, existingUser.passwordHash))) return res.status(400).json({ error: 'Enter your current password to change it.' });
  if (newPassword && newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  try {
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: [firstName, middleName, lastName].filter(Boolean).map((part) => part.trim()).join(' '),
        email: normalizedEmail,
        ...(emailChanged ? { emailVerifiedAt: null } : {}),
        ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
      },
      select: { id: true, username: true, email: true, name: true, role: true, department: true, program: true },
    });
    if (!emailChanged) return res.status(200).json({ user: { ...user, ...getNameParts(user.name) }, message: 'Your account settings were saved.' });
    const rawToken = createEmailToken();
    await prisma.emailToken.create({ data: { tokenHash: hashEmailToken(rawToken), type: 'EMAIL_VERIFY', userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } });
    const verificationUrl = `${getPublicAppUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;
    if (isMailConfigured()) {
      await sendAccountEmail({ to: user.email, subject: 'Verify your updated Norzagaray College Gmail address', html: `<p>Your Gmail address was updated for your Norzagaray College account.</p><p>Verify it by opening <a href="${verificationUrl}">${verificationUrl}</a>.</p><p>This link expires in 24 hours.</p>` });
      return res.status(200).json({ user: { ...user, ...getNameParts(user.name) }, message: 'Settings saved. Check your new Gmail address to verify it.', verificationRequired: true });
    }
    return res.status(200).json({ user: { ...user, ...getNameParts(user.name) }, message: 'Settings saved. Open the development verification link below.', verificationUrl, verificationRequired: true });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'That email address is already in use.' });
    return res.status(500).json({ error: 'Settings could not be saved.' });
  }
}
