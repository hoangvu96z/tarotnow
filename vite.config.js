import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tarot/',
  server: {
    proxy: {
      '/api-vps': {
        target: 'http://43.128.116.69:20128',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-vps/, '')
      }
    }
  }
})
