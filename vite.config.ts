import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  // Local development reads the published inventory without downloading a snapshot.
  server: {
    proxy: {
      '/data/japan-market': { target: 'https://www.innogroup.co.nz', changeOrigin: true },
      '/data/jpauc-paged': { target: 'https://www.innogroup.co.nz', changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/data/japan-market': { target: 'https://www.innogroup.co.nz', changeOrigin: true },
      '/data/jpauc-paged': { target: 'https://www.innogroup.co.nz', changeOrigin: true },
    },
  },
});
