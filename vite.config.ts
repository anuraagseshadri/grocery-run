import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Explicitly tell the Service Worker to cache all image formats
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}']
      },
      manifest: {
        name: 'Grocery Run',
        short_name: 'GroceryRun',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'android-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
          'icons-vendor': ['@iconify/react', 'react-icons/lu']
        }
      }
    }
  }
})