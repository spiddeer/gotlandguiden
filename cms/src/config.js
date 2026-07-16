import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function getConfig(overrides = {}) {
  const env = { ...process.env, ...overrides };
  const production = env.NODE_ENV === 'production';
  const host = env.HOST || '127.0.0.1';
  const port = Number.parseInt(env.PORT || '3000', 10);
  const adminPassword = env.ADMIN_PASSWORD || (production ? '' : 'gotland');
  const sessionSecret = env.SESSION_SECRET || (production ? '' : 'dev-only-change-me-gotlandsguiden');
  const signupCode = env.SIGNUP_CODE || (production ? '' : 'gotland-passkey');
  const localHost = ['0.0.0.0', '127.0.0.1', '::1'].includes(host);
  const hasRpId = Boolean(env.PASSKEY_RP_ID);
  const hasOrigin = Boolean(env.PASSKEY_ORIGIN);
  const passkeyConfigured = !production || (hasRpId && hasOrigin);
  const passkeyRpId = env.PASSKEY_RP_ID || (localHost ? 'localhost' : host);
  const passkeyOrigin = env.PASSKEY_ORIGIN || `${production ? 'https' : 'http'}://${passkeyRpId}:${port}`;

  if (!adminPassword) throw new Error('ADMIN_PASSWORD is required in production');
  if (!sessionSecret || (production && sessionSecret.length < 32)) {
    throw new Error('SESSION_SECRET must contain at least 32 characters in production');
  }
  if (production && hasRpId !== hasOrigin) {
    throw new Error('PASSKEY_RP_ID and PASSKEY_ORIGIN must be configured together');
  }
  if (production && signupCode && !passkeyConfigured) {
    throw new Error('PASSKEY_RP_ID and PASSKEY_ORIGIN are required when passkey signup is enabled in production');
  }
  if (production && signupCode && signupCode.length < 16) {
    throw new Error('SIGNUP_CODE must contain at least 16 characters in production');
  }
  if (production && passkeyConfigured) {
    let origin;
    try {
      origin = new URL(passkeyOrigin);
    } catch {
      throw new Error('PASSKEY_ORIGIN must be a valid HTTPS origin');
    }
    const rpId = passkeyRpId.toLowerCase();
    const hostname = origin.hostname.toLowerCase();
    const validRpId = /^[a-z0-9.-]+$/.test(rpId) && !/^\d+(?:\.\d+){3}$/.test(rpId);
    if (!validRpId || origin.protocol !== 'https:' || origin.origin !== passkeyOrigin
      || (hostname !== rpId && !hostname.endsWith(`.${rpId}`))) {
      throw new Error('PASSKEY_RP_ID and PASSKEY_ORIGIN must describe the same HTTPS site');
    }
  }

  return {
    rootDir,
    host,
    port,
    databasePath: path.resolve(rootDir, env.DATABASE_PATH || './data/places.db'),
    adminUsername: env.ADMIN_USERNAME || 'admin',
    adminPassword,
    sessionSecret,
    signupCode,
    passkeyConfigured,
    signupEnabled: Boolean(signupCode && passkeyConfigured),
    passkeyRpId,
    passkeyOrigin,
    passkeyRpName: env.PASSKEY_RP_NAME || 'Gotlandsguiden CMS',
    production,
    secureCookies: production || env.SECURE_COOKIES === 'true',
  };
}
