import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure environment variables are available at build time
    'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV !== 'production'),
    'import.meta.env.PROD': JSON.stringify(process.env.NODE_ENV === 'production'),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Optimize build for production
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
})
