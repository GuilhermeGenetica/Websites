import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Adicionar esta secção para o proxy da API
  server: {
    proxy: {
      // Redireciona qualquer pedido que comece com /api para o seu servidor PHP
      // Terá de correr o seu servidor PHP localmente (ex: com 'php -S localhost:8000')
      '/api': {
        target: 'http://localhost:8000', // O endereço do seu servidor PHP local
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/api.php'), // Aponta para o ficheiro api.php
      },
    },
  },
})
