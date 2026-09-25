import { prisma } from '../../../lib/prisma';
import { readSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated.' });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true, department: true } });
  if (!user || !['ADVISER', 'ADMIN'].includes(user.role)) return res.status(403).json({ error: 'Review access required.' });
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed.' });
  const { status, adviserStatus } = req.body || {};
  const data = {};
  if (user.role === 'ADVISER' && adviserStatus) data.adviserStatus = adviserStatus;
  if (user.role === 'ADMIN' && status && adviserStatus === 'Approved') data.status = status;
  if (!Object.keys(data).length) return res.status(400).json({ error: 'No permitted review change.' });
  const existing = await prisma.application.findUnique({ where: { applicationNo: req.query.id } });
  if (!existing) return res.status(404).json({ error: 'Application not found.' });
  if (user.role === 'ADVISER' && user.department !== 'GENERAL' && existing.department !== user.department) return res.status(403).json({ error: 'Application belongs to another department.' });
  if (user.role === 'ADMIN' && existing.adviserStatus !== 'Approved') return res.status(409).json({ error: 'Adviser approval is required first.' });
  const application = await prisma.application.update({ where: { id: existing.id }, data });
  return res.status(200).json({ application });
}