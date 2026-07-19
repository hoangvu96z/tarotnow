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
      // SSO proxy — forwards /sso/* to vInfiSSO server in local dev
      '/sso': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

