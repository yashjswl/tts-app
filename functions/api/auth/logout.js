import { clearSessionCookie } from '../../_lib/auth.js';
import { json } from '../../_lib/http.js';

export async function onRequestPost({ request, env, data }) {
  if (data.sessionHash) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(data.sessionHash).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) });
}
