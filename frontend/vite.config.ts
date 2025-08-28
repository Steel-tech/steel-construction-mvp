import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
          router: ['react-router-dom'],
          ui: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      } as any,
    },
    // Generate source maps for production debugging
    sourcemap: true,
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Preview server configuration
  preview: {
    port: 5173,
    strictPort: true,
  },
  // Development server configuration
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
})
