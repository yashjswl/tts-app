export async function onRequest(context) {
  const { request, env } = context;
  const upgradeHeader = request.headers.get('Upgrade');
  
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }
  
  const apiKey = env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "DEEPGRAM_API_KEY missing in environment" }), { status: 500 });
  }

  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/deepgram-api\//, '/');
  // Use https:// to fetch the upgrade request, Cloudflare will handle the WS tunnel
  const targetURL = `https://api.deepgram.com${targetPath}${url.search}`;

  const newRequest = new Request(targetURL, request);
  // Deepgram accepts the key via the Authorization header during the HTTP Upgrade request
  newRequest.headers.set('Authorization', `Token ${apiKey}`);
  
  // Cloudflare seamlessly forwards the 101 Switching Protocols response and streams the WebSocket!
  try {
    return await fetch(newRequest);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
