// Authenticated proxy to Sarvam AI (speech-to-text and text-to-speech).
// functions/_middleware.js has already verified the session and the request origin.
// The API key never leaves the server.
const ALLOWED_PATHS = new Set(['/speech-to-text', '/text-to-speech']);

export async function onRequest({ request, env }) {
  if (!env.SARVAM_API_KEY) {
    return Response.json({ error: 'SARVAM_API_KEY environment variable is missing' }, { status: 500 });
  }
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/sarvam-api/, '');
  if (!ALLOWED_PATHS.has(targetPath)) return new Response('Not found', { status: 404 });

  const headers = new Headers(request.headers);
  headers.delete('Cookie'); // never forward the session cookie to a third party
  headers.delete('Host');
  headers.set('api-subscription-key', env.SARVAM_API_KEY);

  try {
    return await fetch(`https://api.sarvam.ai${targetPath}${url.search}`, {
      method: 'POST',
      headers,
      body: request.body,
      redirect: 'manual',
    });
  } catch (err) {
    return Response.json({ error: 'Failed to reach Sarvam AI', details: err.message }, { status: 502 });
  }
}
