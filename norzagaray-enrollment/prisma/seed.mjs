import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
};

const staff = [
  ['admin', 'admin@norzagaray.edu.ph', 'System Administrator', 'ADMIN', 'GENERAL'],
  ['adviser.beed', 'adviser.beed@norzagaray.edu.ph', 'Liza Cruz', 'ADVISER', 'BEED'],
  ['adviser.bsed', 'adviser.bsed@norzagaray.edu.ph', 'Mark Reyes', 'ADVISER', 'BSED'],
  ['adviser.bshm', 'adviser.bshm@norzagaray.edu.ph', 'Nina Garcia', 'ADVISER', 'BSHM'],
  ['adviser.general', 'adviser.general@norzagaray.edu.ph', 'Omar Flores', 'ADVISER', 'GENERAL'],
];

const students = [
  ['student.beed', 'student.beed@norzagaray.edu.ph', 'Demo BEED Student', 'BEED', '2026-1001'],
  ['student.bsed', 'student.bsed@norzagaray.edu.ph', 'Demo BSED Student', 'BSED', '2026-1002'],
  ['student.bshm', 'student.bshm@norzagaray.edu.ph', 'Demo BSHM Student', 'BSHM', '2026-1003'],
  ['student.bscs', 'student.bscs@norzagaray.edu.ph', 'Demo BSCS Student', 'BSCS', '2026-1004'],
  ['student.act', 'student.act@norzagaray.edu.ph', 'Demo ACT Student', 'ACT', '2026-1005'],
];

for (const [username, email, name, role, department] of staff) {
  await prisma.user.upsert({
    where: { username },
    update: { email, name, passwordHash: hashPassword(username === 'admin' ? 'admin' : 'ChangeMe123!'), role, department, emailVerifiedAt: new Date(), accountStatus: 'APPROVED', approvedAt: new Date() },
    create: { username, email, name, passwordHash: hashPassword(username === 'admin' ? 'admin' : 'ChangeMe123!'), role, department, emailVerifiedAt: new Date(), accountStatus: 'APPROVED', approvedAt: new Date() },
  });
}

for (const [username, email, name, department, studentIdNo] of students) {
  const program = { BEED: 'Bachelor of Elementary Education', BSED: 'Bachelor of Secondary Education', BSHM: 'Bachelor of Science in Hospitality Management', BSCS: 'Bachelor of Science in Computer Science', ACT: 'Associate in Computer Technology' }[department];
  await prisma.user.upsert({
    where: { username },
    update: { email, name, passwordHash: hashPassword('Student123!'), role: 'STUDENT', department, program, emailVerifiedAt: new Date(), accountStatus: 'APPROVED', approvedAt: new Date() },
    create: { username, email, name, passwordHash: hashPassword('Student123!'), role: 'STUDENT', department, program, emailVerifiedAt: new Date(), accountStatus: 'APPROVED', approvedAt: new Date(), studentProfile: { create: { studentIdNo, course: program, department, yearLevel: 1, studentType: 'REGULAR', status: 'ACTIVE', programDurationYears: department === 'ACT' ? 2 : 4, lastEnrolledAt: new Date() } } },
  });
}

const subjects = [
  ['BEED101', 'Foundations of Education', 3, 'MWF 08:00 AM - 09:30 AM', 'BEED'],
  ['BSED101', 'Principles of Teaching', 3, 'TTH 08:00 AM - 09:30 AM', 'BSED'],
  ['BSHM101', 'Hospitality Operations', 3, 'MWF 06:30 PM - 08:00 PM', 'BSHM'],
  ['CS101', 'Intro to Computing', 3, 'MWF 08:00 AM - 09:30 AM', 'BSCS'],
];
for (const [code, title, units, schedule, department] of subjects) {
  await prisma.course.upsert({ where: { code }, update: { title, units, schedule, department, archived: false }, create: { code, title, units, schedule, department } });
}

console.log('Seeded admin/admin, staff accounts, and student demo accounts with Student123!.');
await prisma.$disconnect();
