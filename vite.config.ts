import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The blog pages, sitemap and API come from the Express server (server/), so dev proxies them.
const api = `http://localhost:${process.env.API_PORT || 8787}`

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: { main: 'index.html', admin: 'admin/index.html' },
    },
  },
  server: {
    proxy: {
      '/api': api,
      '/blog': api,
      '/sitemap.xml': api,
      '/robots.txt': api,
    },
  },
})
