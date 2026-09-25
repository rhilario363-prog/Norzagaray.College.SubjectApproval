import { prisma } from '../../../lib/prisma';
import { hashEmailToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const { token } = req.body || {};
  const record = token ? await prisma.emailToken.findFirst({ where: { tokenHash: hashEmailToken(token), type: 'EMAIL_VERIFY', usedAt: null, expiresAt: { gt: new Date() } } }) : null;
  if (!record) return res.status(400).json({ error: 'This verification link is invalid or expired.' });
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return res.status(200).json({ message: 'Email verified. You can now sign in.' });
}
