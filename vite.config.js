import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tarot/',
  server: {
    port: 5174,
    proxy: {
      '/tarot/api-vps': {
        target: 'http://43.128.116.69',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tarot\/api-vps/, '')
      },
      // SSO: VITE_SSO_URL=https://sso.vunph.click (see .env)
    }
  }
})

