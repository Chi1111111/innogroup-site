import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), 'VITE_SUPABASE_URL');
  return {
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
        // Keep the existing catalog API unchanged; its production CORS policy excludes localhost.
        ...(environment.VITE_SUPABASE_URL ? {
          '/functions/v1/japan-photo-review': { target: environment.VITE_SUPABASE_URL, changeOrigin: true },
        } : {}),
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
  };
});
