import { prisma } from '../../../lib/prisma';
import { readSession } from '../../../lib/auth';

function canReview(role) {
  return role === 'ADVISER' || role === 'ADMIN';
}

export default async function handler(req, res) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated.' });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true, name: true, department: true, studentProfile: { select: { studentIdNo: true } } } });
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });

  if (req.method === 'GET') {
    const where = canReview(user.role) ? (user.role === 'ADVISER' && user.department !== 'GENERAL' ? { department: user.department } : {}) : { studentIdNo: user.studentProfile?.studentIdNo || '' };
    const applications = await prisma.application.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ applications });
  }

  if (req.method === 'POST') {
    if (user.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can submit applications.' });
    const { studentName, studentIdNo, program, department = 'GENERAL', subjects = [] } = req.body || {};
    if (!studentName || !studentIdNo || !program || !subjects.length) return res.status(400).json({ error: 'Complete the subject load before submitting.' });
    if (user.studentProfile?.studentIdNo !== studentIdNo) return res.status(403).json({ error: 'Student profile does not match this application.' });
    const units = subjects.reduce((total, subject) => total + Number(subject.units || 0), 0);
    const application = await prisma.application.upsert({
      where: { applicationNo: `APP-${studentIdNo}` },
      update: { studentName, program, department, units, subjects, status: 'PENDING', adviserStatus: 'Pending' },
      create: { applicationNo: `APP-${studentIdNo}`, studentName, studentIdNo, program, department, units, subjects },
    });
    return res.status(201).json({ application });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}