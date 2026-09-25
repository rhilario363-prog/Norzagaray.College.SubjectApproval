import { prisma } from '../../../lib/prisma';
import { readSession } from '../../../lib/auth';

const courseFields = {
  id: true, code: true, title: true, units: true, schedule: true, department: true, yearLevel: true, section: true, room: true, day: true, time: true,
  archived: true, status: true, submittedById: true, reviewedAt: true,
};

async function currentUser(req) {
  const session = readSession(req);
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, role: true, department: true } });
}

export default async function handler(req, res) {
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });

  if (req.method === 'GET') {
    const where = user.role === 'ADMIN'
      ? {}
      : user.role === 'ADVISER'
        ? { OR: [{ department: user.department, status: 'APPROVED' }, { submittedById: user.id }] }
        : { department: user.department, status: 'APPROVED', archived: false };
    const courses = await prisma.course.findMany({ where, select: courseFields, orderBy: [{ status: 'asc' }, { code: 'asc' }] });
    return res.status(200).json({ courses });
  }

  if (req.method === 'POST') {
    if (user.role !== 'ADVISER') return res.status(403).json({ error: 'Only professors can submit subjects.' });
    const { code, title, units, schedule, department, yearLevel, section, room, day, time } = req.body || {};
    if (!code?.trim() || !title?.trim() || !Number(units) || department !== user.department) return res.status(400).json({ error: 'Confirm that the subject department matches your professor department.' });
    try {
      const course = await prisma.course.create({
        data: {
          code: code.trim().toUpperCase(), title: title.trim(), units: Number(units), schedule: schedule || 'Schedule TBA',
          department: user.department, status: 'PENDING', submittedById: user.id,
          archived: false, yearLevel: Number(yearLevel) || 1, section: section || 'Section TBA', room: room || 'Room TBA', day: day || '', time: time || '',
        },
        select: courseFields,
      });
      return res.status(201).json({ course });
    } catch (error) {
      if (error.code === 'P2002') return res.status(409).json({ error: 'That subject code is already recorded.' });
      return res.status(500).json({ error: 'Subject request could not be submitted.' });
    }
  }

  if (req.method === 'PATCH') {
    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Only administrators can approve subjects.' });
    const { id, status } = req.body || {};
    if (!id || !['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Choose an approval decision.' });
    const course = await prisma.course.update({ where: { id }, data: { status, reviewedAt: new Date() }, select: courseFields });
    return res.status(200).json({ course });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
