import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_REPO_BASE ?? '/',
  build: { chunkSizeWarningLimit: 1200 },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
