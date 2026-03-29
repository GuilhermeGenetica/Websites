import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // A base DEVE ser '/' porque a sua aplicação está na raiz do domínio.
  base: '/',
  build: {
    outDir: 'dist',
  },
  server: {
    cors: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
