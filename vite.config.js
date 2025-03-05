import viteReact from '@vitejs/plugin-react'
import { viteFastify } from '@fastify/vite/plugin'
import tailwindcss from '@tailwindcss/vite';
import { join } from 'node:path' 
import { defineConfig } from 'vite'
export default defineConfig({
  root: join(import.meta.dirname, 'src/client'),
  plugins: [
    viteReact(),
    viteFastify(),
    tailwindcss()
  ],
  build: {
    emptyOutDir: true,
    outDir: join(import.meta.dirname, 'dist/client')
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7070',
        changeOrigin: true
      }
  }}
})