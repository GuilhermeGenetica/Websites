import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        // This target should point to your LOCAL PHP server setup (e.g., XAMPP, MAMP, WAMP).
        // It's used only for development with `npm run dev` to avoid CORS issues.
        // The path should be the URL to your project folder where the `api` directory is located.
        // Example for XAMPP: 'http://localhost/nutragenius/api'
        target: 'http://localhost/nutragenius-portal/api', 
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

