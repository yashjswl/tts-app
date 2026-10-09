import { generatePassword, hashPassword } from '../../../_lib/crypto.js';
import { publicUser } from '../../../_lib/db.js';
import { fail, json, readJson } from '../../../_lib/http.js';

async function findTarget(env, id) {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(id).first();
}

// PATCH { disabled?: boolean, resetPassword?: true, name?: string }
export async function onRequestPatch({ request, env, params }) {
  const body = await readJson(request);
  if (!body) return fail(400, 'Invalid request.');

  const target = await findTarget(env, params.id);
  if (!target) return fail(404, 'That person no longer exists.');
  if (target.role === 'admin' && (body.disabled !== undefined || body.resetPassword)) {
    return fail(403, 'The administrator account cannot be disabled or reset here.');
  }

  const statements = [];
  let temporaryPassword;

  if (typeof body.name === 'string' && body.name.trim()) {
    statements.push(env.DB.prepare('UPDATE users SET name = ?1 WHERE id = ?2').bind(body.name.trim().slice(0, 80), target.id));
  }
  if (typeof body.disabled === 'boolean') {
    statements.push(env.DB.prepare('UPDATE users SET disabled = ?1 WHERE id = ?2').bind(body.disabled ? 1 : 0, target.id));
    if (body.disabled) statements.push(env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(target.id));
  }
  if (body.resetPassword) {
    temporaryPassword = generatePassword();
    statements.push(
      env.DB
        .prepare('UPDATE users SET password_hash = ?1, must_change_password = 1 WHERE id = ?2')
        .bind(await hashPassword(temporaryPassword), target.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(target.id)
    );
  }
  if (!statements.length) return fail(400, 'Nothing to change.');

  await env.DB.batch(statements);
  const user = await findTarget(env, target.id);
  return json({ user: publicUser(user), ...(temporaryPassword && { temporaryPassword }) });
}

export async function onRequestDelete({ env, params }) {
  const target = await findTarget(env, params.id);
  if (!target) return fail(404, 'That person no longer exists.');
  if (target.role === 'admin') return fail(403, 'The administrator account cannot be deleted.');

  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(target.id),
    env.DB.prepare('DELETE FROM users WHERE id = ?1').bind(target.id),
  ]);
  return json({ ok: true });
}
