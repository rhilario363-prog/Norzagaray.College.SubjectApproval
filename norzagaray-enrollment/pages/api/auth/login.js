import { prisma } from '../../../lib/prisma';
import { setSessionCookie, verifyPassword } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const { username, password } = req.body || {};
  let user;
  try {
    user = username ? await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } }) : null;
  } catch (error) {
    console.error('Login database lookup failed:', error.message);
    return res.status(503).json({ error: 'The database is unavailable. Update DATABASE_URL and DIRECT_URL with the current Supabase connection strings, then restart the server.' });
  }
  if (!user || !verifyPassword(password || '', user.passwordHash)) return res.status(401).json({ error: 'Invalid username or password.' });
  if (!user.emailVerifiedAt) return res.status(403).json({ error: 'Verify your Gmail address before signing in.' });
  if (user.accountStatus !== 'APPROVED') return res.status(403).json({ error: user.accountStatus === 'REJECTED' ? 'This account was rejected by an administrator.' : 'Your account is waiting for administrator approval.' });
  setSessionCookie(res, user.id);
  return res.status(200).json({ user: { id: user.id, username: user.username, name: user.name, role: user.role, department: user.department, program: user.program } });
}
