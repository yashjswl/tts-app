import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sarvam-api': {
        target: 'https://api.sarvam.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sarvam-api/, '')
      },
      '/sarvam-ws': {
        target: 'wss://api.sarvam.ai',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sarvam-ws/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            const url = new URL(req.url, 'http://localhost');
            const apiKey = url.searchParams.get('api_key');
            if (apiKey) {
              proxyReq.setHeader('api-subscription-key', apiKey);
              // Clean the path before sending to Sarvam so they don't see the query param
              proxyReq.path = proxyReq.path.split('&api_key=')[0].split('?api_key=')[0];
            }
          });
        }
      }
    }
  },
  preview: {
    proxy: {
      '/sarvam-api': {
        target: 'https://api.sarvam.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sarvam-api/, '')
      }
    }
  }
})
