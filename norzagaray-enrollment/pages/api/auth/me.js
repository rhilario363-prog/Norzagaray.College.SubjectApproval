import { prisma } from '../../../lib/prisma';
import { readSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated.' });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, username: true, name: true, role: true, department: true, program: true, accountStatus: true } });
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  return res.status(200).json({ user });
}
