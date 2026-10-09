// Authenticated WebSocket proxy to Deepgram live transcription.
// functions/_middleware.js has already verified the session and the request origin.
// The API key never leaves the server.
const ALLOWED_PATHS = new Set(['/v1/listen']);

export async function onRequest({ request, env }) {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }
  if (!env.DEEPGRAM_API_KEY) {
    return Response.json({ error: 'DEEPGRAM_API_KEY is missing in the environment' }, { status: 500 });
  }

  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/deepgram-api/, '');
  if (!ALLOWED_PATHS.has(targetPath)) return new Response('Not found', { status: 404 });

  const upstream = new Request(`https://api.deepgram.com${targetPath}${url.search}`, request);
  upstream.headers.delete('Cookie'); // never forward the session cookie to a third party
  upstream.headers.set('Authorization', `Token ${env.DEEPGRAM_API_KEY}`);

  try {
    return await fetch(upstream);
  } catch (err) {
    return new Response(err.message, { status: 502 });
  }
}
