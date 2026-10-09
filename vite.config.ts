import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from GitHub Pages at https://pauseai.github.io/volunteer-portal-prototype/
export default defineConfig({
  base: '/volunteer-portal-prototype/',
  plugins: [react(), tailwindcss()],
})
