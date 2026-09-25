import { prisma } from '../../../lib/prisma';
import { createEmailToken, getPublicAppUrl, hashEmailToken, hashPassword } from '../../../lib/auth';
import { isMailConfigured, sendAccountEmail } from '../../../lib/mail';

const PROGRAMS = {
  BEED: { label: 'Bachelor of Elementary Education', years: 4 },
  BSED: { label: 'Bachelor of Secondary Education', years: 4 },
  BSHM: { label: 'Bachelor of Science in Hospitality Management', years: 4 },
  BSCS: { label: 'Bachelor of Science in Computer Science', years: 4 },
  ACT: { label: 'Associate in Computer Technology', years: 2 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const { username, password, confirmPassword, firstName, middleName, lastName, email, department = 'BEED', program, studentIdNo, studentType = 'TRANSFEREE', transferSchool, transferCredits = 0 } = req.body || {};
  const name = [firstName, middleName, lastName].map((part) => part?.trim()).join(' ');
  if (!username || !password || !confirmPassword || !firstName || !middleName || !lastName || !email || !PROGRAMS[department]) {
    return res.status(400).json({ error: 'Complete the account and department fields.' });
  }
  if (!/^[^\s@]+@gmail\.com$/i.test(email.trim())) return res.status(400).json({ error: 'Use a valid Gmail address for verification.' });
  if (!/(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/.test(password)) return res.status(400).json({ error: 'Password must be at least 8 characters and include a number and special character.' });
  if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });
  if (!/^\d{4}-\d{4}$/.test(studentIdNo || '')) return res.status(400).json({ error: 'Student number must follow the format 2024-0008.' });
  if (!['TRANSFEREE', 'RETURNEE'].includes(studentType)) return res.status(400).json({ error: 'Choose Transferee or Returnee.' });
  if (studentType === 'TRANSFEREE' && !transferSchool) return res.status(400).json({ error: 'Previous school is required for transferees.' });
  if (!isMailConfigured() && process.env.NODE_ENV === 'production') return res.status(503).json({ error: 'Account email delivery is not configured. Set Gmail SMTP variables before accepting registrations.' });
  let createdUserId;
  try {
    const user = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        name: name.trim(),
        role: 'STUDENT',
        department,
        program: PROGRAMS[department].label,
        studentProfile: { create: { studentIdNo: studentIdNo.trim(), course: PROGRAMS[department].label, department, yearLevel: 1, studentType, status: studentType === 'TRANSFEREE' ? 'TRANSFEREE' : 'ACTIVE', programDurationYears: PROGRAMS[department].years, transferSchool: studentType === 'TRANSFEREE' ? transferSchool : null, transferCredits: studentType === 'TRANSFEREE' ? Number(transferCredits) : 0, lastEnrolledAt: new Date() } },
      },
      select: { id: true, username: true, name: true, role: true, department: true, program: true },
    });
    createdUserId = user.id;
    const rawToken = createEmailToken();
    await prisma.emailToken.create({ data: { tokenHash: hashEmailToken(rawToken), type: 'EMAIL_VERIFY', userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } });
    const verifyUrl = `${getPublicAppUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;
    let verificationUrl;
    if (isMailConfigured()) {
      await sendAccountEmail({ to: email, subject: 'Verify your Norzagaray College account', html: `<p>Welcome to Norzagaray College.</p><p>Verify your account by opening <a href="${verifyUrl}">${verifyUrl}</a>.</p><p>This link expires in 24 hours.</p>` });
    } else {
      verificationUrl = verifyUrl;
      console.warn(`Development email preview for ${email}: ${verifyUrl}`);
    }
    return res.status(201).json({ message: isMailConfigured() ? 'Account created. Verify your Gmail, then wait for administrator approval before signing in.' : 'Development account created. Verify the link below, then wait for administrator approval.', verificationUrl, user });
  } catch (error) {
    if (createdUserId && error.message !== 'Email delivery is not configured.') {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
    if (error.code === 'P2002') return res.status(409).json({ error: 'Username, email, or student ID is already registered.' });
    if (error.message === 'Email delivery is not configured.') return res.status(503).json({ error: 'Account email delivery is not configured yet. Ask the administrator to set the Gmail SMTP variables.' });
    if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017' || error.message?.includes('tenant/user') || error.message?.includes('Can\'t reach database server')) return res.status(503).json({ error: 'The database is unavailable. Update DATABASE_URL and DIRECT_URL with the current Supabase connection strings, then restart the server.' });
    console.error('Student registration failed:', error);
    return res.status(500).json({ error: 'Account could not be created. Check the server logs for details.' });
  }
}
