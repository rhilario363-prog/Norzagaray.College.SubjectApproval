import crypto from 'crypto';

const SESSION_COOKIE = 'norzagaray_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace-this-session-secret-before-production';

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (configuredUrl) return configuredUrl;
  if (process.env.NODE_ENV === 'production') throw new Error('NEXT_PUBLIC_APP_URL is required in production.');
  return 'http://localhost:3000';
}

export function createEmailToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashEmailToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(':');
  if (!salt || !storedHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  const expected = Buffer.from(storedHash, 'hex');
  const actual = Buffer.from(hash, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}

export function createSession(userId) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + 1000 * 60 * 60 * 12 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readSession(request) {
  const cookie = request.headers.cookie?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;
  const token = cookie.slice(`${SESSION_COOKIE}=`.length);
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (signature !== expected) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(response, userId) {
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=${createSession(userId)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

export function clearSessionCookie(response) {
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}
