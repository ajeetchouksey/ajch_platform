import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_REPO_BASE ?? '/',
  build: {},
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Changes with every deploy (each deploy builds a new commit), so the SkillUp runtime URLs change too:
    // Cloudflare's 4-hour browser cache TTL overrides the max-age=0 in public/_headers for .js and .css.
    __SKILLUP_ASSETS_VERSION__: JSON.stringify((process.env.GITHUB_SHA ?? Date.now().toString(36)).slice(0, 12)),
  },
})
