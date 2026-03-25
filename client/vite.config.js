import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',  // 绝对路径，避免二级路由资源加载问题
  build: {
    outDir: path.resolve(__dirname, '../server/public'),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api/': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
