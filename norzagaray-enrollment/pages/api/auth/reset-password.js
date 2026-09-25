import { prisma } from '../../../lib/prisma';
import { hashEmailToken, hashPassword } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const { token, password } = req.body || {};
  if (!token || !password || password.length < 8) return res.status(400).json({ error: 'Use a password with at least 8 characters.' });
  const record = await prisma.emailToken.findFirst({ where: { tokenHash: hashEmailToken(token), type: 'PASSWORD_RESET', usedAt: null, expiresAt: { gt: new Date() } } });
  if (!record) return res.status(400).json({ error: 'This reset link is invalid or expired.' });
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hashPassword(password) } }),
    prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return res.status(200).json({ message: 'Password updated. You can now sign in.' });
}
