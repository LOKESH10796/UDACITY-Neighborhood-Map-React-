import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Neighborhood Map - Pune Restaurants',
        short_name: 'Neighborhood Map',
        theme_color: '#0ea5e9',
        icons: []
      }
    })
  ]
})