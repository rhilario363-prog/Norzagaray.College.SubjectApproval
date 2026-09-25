import { prisma } from '../../../lib/prisma';
import { readSession } from '../../../lib/auth';

async function getAdmin(req) {
  const session = readSession(req);
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, role: true } });
}

export default async function handler(req, res) {
  const admin = await getAdmin(req);
  if (!admin || admin.role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });

  if (req.method === 'GET') {
    const accounts = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      select: { id: true, username: true, email: true, name: true, role: true, department: true, accountStatus: true, emailVerifiedAt: true, createdAt: true },
      orderBy: [{ accountStatus: 'asc' }, { createdAt: 'desc' }],
    });
    return res.status(200).json({ accounts });
  }

  if (req.method === 'PATCH') {
    const { userId, accountStatus } = req.body || {};
    if (!userId || !['APPROVED', 'REJECTED'].includes(accountStatus)) return res.status(400).json({ error: 'Choose an account decision.' });
    const account = await prisma.user.update({ where: { id: userId }, data: { accountStatus, approvedAt: accountStatus === 'APPROVED' ? new Date() : null }, select: { id: true, accountStatus: true } });
    return res.status(200).json({ account });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
