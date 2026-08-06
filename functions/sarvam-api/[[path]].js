export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // The path starts with /sarvam-api/. We need to strip that and forward to api.sarvam.ai
  const targetPath = url.pathname.replace(/^\/sarvam-api\//, '/');
  const targetURL = `https://api.sarvam.ai${targetPath}${url.search}`;

  // Read the SARVAM_API_KEY from the Cloudflare Environment Variables
  const apiKey = env.SARVAM_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "SARVAM_API_KEY environment variable is missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Create a new headers object, copying all incoming headers
  const newHeaders = new Headers(request.headers);
  // Inject the API key securely on the server side
  newHeaders.set('api-subscription-key', apiKey);
  // Prevent Host header mismatch issues
  newHeaders.delete('host');

  // Create the proxy request
  const proxyRequest = new Request(targetURL, {
    method: request.method,
    headers: newHeaders,
    body: request.body,
    redirect: "manual"
  });

  try {
    const response = await fetch(proxyRequest);
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch from Sarvam AI", details: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
}
