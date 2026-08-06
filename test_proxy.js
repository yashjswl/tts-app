const { createServer } = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'wss://api.sarvam.ai',
  ws: true,
  changeOrigin: true
});

proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
  const url = new URL(req.url, 'http://localhost');
  const apiKey = url.searchParams.get('api_key');
  console.log("Original URL:", req.url);
  console.log("Extracted API Key:", apiKey);
  if (apiKey) {
    proxyReq.setHeader('api-subscription-key', apiKey);
    proxyReq.path = proxyReq.path.split('&api_key=')[0].split('?api_key=')[0];
    console.log("Final Path:", proxyReq.path);
  }
});

const server = createServer((req, res) => {
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  req.url = req.url.replace(/^\/sarvam-ws/, '');
  proxy.ws(req, socket, head);
});

server.listen(5175, () => {
  console.log("Proxy listening on 5175");
  
  const WebSocket = require('ws');
  const ws = new WebSocket('ws://localhost:5175/sarvam-ws/speech-to-text-realtime/ws?language_code=hi-IN&model=saaras:v3-realtime&api_key=MY_SUPER_SECRET_KEY');
  ws.on('open', () => console.log('PROXY WS OPENED!'));
  ws.on('message', (msg) => console.log('PROXY MSG:', msg.toString()));
  ws.on('close', (code, reason) => {
    console.log('PROXY CLOSE:', code, reason.toString());
    process.exit(0);
  });
});
