import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
});
