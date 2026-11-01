import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The site is served from https://<user>.github.io/<repo>/ on GitHub Pages,
// so production builds need the repository name as base path.
// VITE_BASE can override it (e.g. "/" for a custom domain later).
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? (command === 'build' ? '/telauto/' : '/'),
  plugins: [react(), tailwindcss()],
}))
