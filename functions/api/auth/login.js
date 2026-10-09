import { adminEmail, createSession, sessionCookie } from '../../_lib/auth.js';
import { hashPassword, timingSafeEqual, verifyPassword } from '../../_lib/crypto.js';
import { fail, json, normalizeEmail, readJson } from '../../_lib/http.js';
import { publicUser } from '../../_lib/db.js';

const MAX_FAILURES = 6;
const WINDOW_MS = 15 * 60 * 1000;

// Verified against when the email is unknown, so unknown and known emails take the same time.
let dummyHash = null;

async function isThrottled(db, key, now) {
  const row = await db.prepare('SELECT count, window_start FROM login_attempts WHERE key = ?1').bind(key).first();
  if (!row || row.window_start < now - WINDOW_MS) return 0;
  return row.count >= MAX_FAILURES ? Math.ceil((row.window_start + WINDOW_MS - now) / 60000) : 0;
}

function recordFailure(db, key, now) {
  return db
    .prepare(
      `INSERT INTO login_attempts (key, count, window_start) VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN window_start < ?3 THEN 1 ELSE count + 1 END,
         window_start = CASE WHEN window_start < ?3 THEN ?2 ELSE window_start END`
    )
    .bind(key, now, now - WINDOW_MS)
    .run();
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) return fail(400, 'Enter your email and password.');

  const db = env.DB;
  const now = Date.now();
  const attemptKey = `${email}|${request.headers.get('CF-Connecting-IP') || 'local'}`;

  const waitMinutes = await isThrottled(db, attemptKey, now);
  if (waitMinutes) {
    return fail(429, `Too many failed attempts. Try again in ${waitMinutes} minute${waitMinutes === 1 ? '' : 's'}.`);
  }

  let user = await db.prepare('SELECT * FROM users WHERE email = ?1').bind(email).first();
  let valid = false;

  if (user) {
    valid = await verifyPassword(password, user.password_hash);
  } else if (
    email === adminEmail(env) &&
    env.ADMIN_INITIAL_PASSWORD &&
    timingSafeEqual(password, env.ADMIN_INITIAL_PASSWORD)
  ) {
    // First sign-in of the administrator: the account is created from the deployment secret.
    await db
      .prepare(
        `INSERT OR IGNORE INTO users (id, email, name, role, password_hash, must_change_password, created_at)
         VALUES (?1, ?2, 'Administrator', 'admin', ?3, 0, ?4)`
      )
      .bind(crypto.randomUUID(), email, await hashPassword(password), now)
      .run();
    user = await db.prepare('SELECT * FROM users WHERE email = ?1').bind(email).first();
    valid = !!user;
  } else {
    dummyHash ??= await hashPassword('not-a-real-password');
    await verifyPassword(password, dummyHash);
  }

  if (!valid) {
    await recordFailure(db, attemptKey, now);
    return fail(401, 'That email and password do not match.');
  }
  if (user.disabled) {
    return fail(403, 'This account has been disabled. Contact your administrator.');
  }

  await db.batch([
    db.prepare('DELETE FROM login_attempts WHERE key = ?1').bind(attemptKey),
    db.prepare('DELETE FROM sessions WHERE expires_at < ?1').bind(now),
    db.prepare('UPDATE users SET last_login_at = ?1 WHERE id = ?2').bind(now, user.id),
  ]);

  const token = await createSession(db, user.id);
  return json({ user: publicUser({ ...user, last_login_at: now }) }, 200, {
    'Set-Cookie': sessionCookie(request, token),
  });
}
