import { ensureSchema } from './_lib/db.js';
import { getSession } from './_lib/auth.js';
import { fail } from './_lib/http.js';

// Paths anyone may call without a session.
const PUBLIC_API = new Set(['/api/auth/login', '/api/auth/logout', '/api/auth/me']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Pages only runs this middleware for the routes listed in public/_routes.json.
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const isProxy = path.startsWith('/deepgram-api/') || path.startsWith('/sarvam-api/');
  const isApi = path.startsWith('/api/');

  if (!isProxy && !isApi) return next();

  if (!env.DB) {
    return fail(500, 'The user database is not configured. Bind a D1 database named DB to this project.');
  }

  try {
    await ensureSchema(env.DB);

    // Cookies are SameSite=Lax; also require a same-origin Origin on anything that changes state
    // or opens a WebSocket, so another site cannot ride a signed-in session.
    const origin = request.headers.get('Origin');
    const isUpgrade = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
    if ((!SAFE_METHODS.has(request.method) || isUpgrade) && origin !== url.origin) {
      return fail(403, 'Cross-origin request blocked.');
    }

    const session = await getSession(env.DB, request);
    context.data.user = session?.user ?? null;
    context.data.sessionHash = session?.tokenHash ?? null;

    if (isProxy || !PUBLIC_API.has(path)) {
      if (!session) return fail(401, 'Sign in to continue.');
      if (path.startsWith('/api/admin/') && session.user.role !== 'admin') {
        return fail(403, 'Administrator access required.');
      }
    }

    return await next();
  } catch (err) {
    console.error('Request failed', path, err);
    return fail(500, 'Something went wrong on the server.');
  }
}
