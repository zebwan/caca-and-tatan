import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so the built game in dist/ works from any folder or static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1600 },
})
