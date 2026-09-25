import { prisma } from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';

const roles = new Set(['ADVISER']);
const departments = new Set(['GENERAL', 'BEED', 'BSED', 'BSHM', 'BSCS', 'ACT']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const { role, username, password, confirmPassword, firstName, middleName, lastName, email, department = 'GENERAL' } = req.body || {};
  if (!roles.has(role) || !username || !password || !confirmPassword || !firstName || !lastName || !email || !departments.has(department)) return res.status(400).json({ error: 'Complete all staff account fields.' });
  const name = [firstName, middleName, lastName].filter(Boolean).map((part) => part.trim()).join(' ');
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });
  if (!email.trim().toLowerCase().endsWith('@gmail.com')) return res.status(400).json({ error: 'Use a Gmail address for the staff profile.' });
  if (role === 'ADVISER' && department === 'GENERAL') return res.status(400).json({ error: 'Choose the professor department.' });

  try {
    const user = await prisma.user.create({
      data: { username: username.trim().toLowerCase(), email: email.trim().toLowerCase(), passwordHash: hashPassword(password), name: name.trim(), role, department, emailVerifiedAt: new Date() },
      select: { id: true, username: true, name: true, role: true, department: true },
    });
    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'That username or Gmail address is already registered.' });
    if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017' || error.message?.includes('tenant/user') || error.message?.includes('Can\'t reach database server')) return res.status(503).json({ error: 'The database is unavailable. Update DATABASE_URL and DIRECT_URL with the current Supabase connection strings, then restart the server.' });
    console.error('Professor registration failed:', error);
    return res.status(500).json({ error: 'Staff account could not be created.' });
  }
}
