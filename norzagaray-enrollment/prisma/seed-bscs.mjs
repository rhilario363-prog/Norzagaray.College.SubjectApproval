import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import nextEnv from '@next/env';
import { BSCS_SAMPLE_CURRICULUM } from '../lib/bscsSampleCurriculum.mjs';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const username = 'adviser.bscs';
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
};

try {
  await prisma.$transaction(async (transaction) => {
    const existingAdviser = await transaction.user.findUnique({ where: { username }, select: { role: true } });
    if (existingAdviser && existingAdviser.role !== 'ADVISER') {
      throw new Error(`Cannot add ${username}: that username is already used by a non-adviser account.`);
    }
    if (!existingAdviser) {
      await transaction.user.create({
        data: {
          username,
          email: 'adviser.bscs@norzagaray.edu.ph',
          name: 'BSCS Adviser',
          passwordHash: hashPassword('ChangeMe123!'),
          role: 'ADVISER',
          department: 'BSCS',
          emailVerifiedAt: new Date(),
          accountStatus: 'APPROVED',
          approvedAt: new Date(),
        },
      });
    }

    const result = await transaction.course.createMany({
      data: BSCS_SAMPLE_CURRICULUM.map(({ code, title, units, yearLevel }) => ({
        code,
        title,
        units,
        schedule: 'Schedule TBA',
        department: 'BSCS',
        yearLevel,
        section: `BSCS ${yearLevel}A`,
        room: 'Room TBA',
        status: 'APPROVED',
      })),
      skipDuplicates: true,
    });
    console.log(`BSCS adviser is ready; added ${result.count} new sample courses.`);
  });
} finally {
  await prisma.$disconnect();
}
