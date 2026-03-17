import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const proxyTarget = env.OCR_PROXY_TARGET || 'http://127.0.0.1:11434'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/proxy': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
        },
      },
    },
  }
})
