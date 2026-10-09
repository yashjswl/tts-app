import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run api` serves the Pages Functions (login, admin, Deepgram/Sarvam proxies) on this port.
const api = { target: 'http://localhost:8788', changeOrigin: false }

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': api,
      '/sarvam-api': api,
      '/deepgram-api': { ...api, ws: true },
    },
  },
})
