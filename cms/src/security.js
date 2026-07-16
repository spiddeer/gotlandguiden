import crypto from 'node:crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 12;

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyCredentials(username, password, config) {
  return safeEqual(username, config.adminUsername) && safeEqual(password, config.adminPassword);
}

export function createSession(config, user = config.adminUsername, now = Date.now()) {
  const payload = encode(JSON.stringify({
    user,
    exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS,
    csrf: crypto.randomBytes(24).toString('base64url'),
  }));
  return `${payload}.${sign(payload, config.sessionSecret)}`;
}

export function readSession(cookieValue, config, now = Date.now()) {
  if (!cookieValue) return null;
  const [payload, signature, extra] = cookieValue.split('.');
  if (!payload || !signature || extra || !safeEqual(signature, sign(payload, config.sessionSecret))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof session.user !== 'string' || !session.user || session.exp <= Math.floor(now / 1000) || !session.csrf) return null;
    return session;
  } catch {
    return null;
  }
}

export function secureEqual(left, right) {
  return safeEqual(left, right);
}

export function getCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').flatMap((part) => {
    const index = part.indexOf('=');
    if (index < 0) return [];
    return [[part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())]];
  }));
}

export function sessionCookie(value, config) {
  const secure = config.secureCookies ? '; Secure' : '';
  return `gg_admin=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function clearSessionCookie(config) {
  const secure = config.secureCookies ? '; Secure' : '';
  return `gg_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export class LoginLimiter {
  constructor() {
    this.attempts = new Map();
  }

  canAttempt(key, now = Date.now()) {
    const entry = this.attempts.get(key);
    if (!entry || entry.resetAt <= now) {
      this.attempts.delete(key);
      return true;
    }
    return entry.count < 5;
  }

  fail(key, now = Date.now()) {
    const entry = this.attempts.get(key);
    if (!entry || entry.resetAt <= now) this.attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    else entry.count += 1;
  }

  success(key) {
    this.attempts.delete(key);
  }
}
