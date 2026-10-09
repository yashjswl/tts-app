import { hashPassword, verifyPassword } from '../../_lib/crypto.js';
import { fail, json, readJson } from '../../_lib/http.js';
import { publicUser } from '../../_lib/db.js';

const MIN_PASSWORD_LENGTH = 10;

export async function onRequestPost({ request, env, data }) {
  const body = await readJson(request);
  const current = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
  const next = typeof body?.newPassword === 'string' ? body.newPassword : '';

  if (next.length < MIN_PASSWORD_LENGTH) {
    return fail(400, `Use at least ${MIN_PASSWORD_LENGTH} characters for the new password.`);
  }
  if (next.length > 200) return fail(400, 'That password is too long.');
  if (next === current) return fail(400, 'Choose a password different from the current one.');
  if (!(await verifyPassword(current, data.user.password_hash))) {
    return fail(403, 'The current password is not correct.');
  }

  // Changing the password signs out every other device.
  await env.DB.batch([
    env.DB
      .prepare('UPDATE users SET password_hash = ?1, must_change_password = 0 WHERE id = ?2')
      .bind(await hashPassword(next), data.user.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1 AND token_hash != ?2').bind(data.user.id, data.sessionHash),
  ]);

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(data.user.id).first();
  return json({ user: publicUser(user) });
}
