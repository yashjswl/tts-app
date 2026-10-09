import { generatePassword, hashPassword } from '../../../_lib/crypto.js';
import { publicUser } from '../../../_lib/db.js';
import { fail, json, normalizeEmail, readJson } from '../../../_lib/http.js';

const MIN_PASSWORD_LENGTH = 10;

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM users ORDER BY role = 'admin' DESC, created_at ASC"
  ).all();
  return json({ users: results.map(publicUser) });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const name = String(body?.name ?? '').trim().slice(0, 80);
  if (!email) return fail(400, 'Enter a valid email address.');
  if (!name) return fail(400, 'Enter the person’s name.');

  let password = typeof body?.password === 'string' ? body.password : '';
  const generated = !password;
  if (generated) password = generatePassword();
  else if (password.length < MIN_PASSWORD_LENGTH) {
    return fail(400, `Use at least ${MIN_PASSWORD_LENGTH} characters for the password.`);
  }

  const id = crypto.randomUUID();
  try {
    await env.DB
      .prepare(
        `INSERT INTO users (id, email, name, role, password_hash, must_change_password, created_at)
         VALUES (?1, ?2, ?3, 'user', ?4, 1, ?5)`
      )
      .bind(id, email, name, await hashPassword(password), Date.now())
      .run();
  } catch (err) {
    if (String(err?.message || err).includes('UNIQUE')) {
      return fail(409, 'Someone with that email already has an account.');
    }
    throw err;
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(id).first();
  return json({ user: publicUser(user), temporaryPassword: password, generated }, 201);
}
