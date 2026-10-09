import { randomToken, sha256Hex } from './crypto.js';

export const SESSION_COOKIE = 'duologue_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

// The only account that gets the admin role. Override with the ADMIN_EMAIL variable.
const DEFAULT_ADMIN_EMAIL = 'yashasvi.jaiswal.2006@gmail.com';

export function adminEmail(env) {
  return String(env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

function cookieFlags(request) {
  const secure = new URL(request.url).protocol === 'https:';
  return `Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function sessionCookie(request, token) {
  return `${SESSION_COOKIE}=${token}; Max-Age=${SESSION_TTL_SECONDS}; ${cookieFlags(request)}`;
}

export function clearSessionCookie(request) {
  return `${SESSION_COOKIE}=; Max-Age=0; ${cookieFlags(request)}`;
}

/** Create a session row and return the raw token (only its hash is stored). */
export async function createSession(db, userId) {
  const token = randomToken();
  const now = Date.now();
  await db
    .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(await sha256Hex(token), userId, now, now + SESSION_TTL_SECONDS * 1000)
    .run();
  return token;
}

/** Resolve the signed-in user for a request, or null. */
export async function getSession(db, request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?1 AND s.expires_at > ?2 AND u.disabled = 0`
    )
    .bind(tokenHash, Date.now())
    .first();
  return row ? { user: row, tokenHash } : null;
}
