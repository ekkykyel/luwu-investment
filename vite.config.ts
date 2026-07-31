import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  return {
    base: '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 2000,
      sourcemap: false,
      minify: true,
      commonjsOptions: {
        transformMixedEsModules: true,
        requireReturnsDefault: true,
      },
      rollupOptions: {
        cache: false,
        maxParallelFileOps: 3,
      }
    },
    plugins: [
      react(), 
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@turf/turf': path.resolve(__dirname, './src/utils/turf-shim.ts'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});

// trigger sync code freeze v1.0.0
// trigger sync for AI prompt update
// trigger sync for UI polish
// trigger sync for visual polish
// force sync for visual polish
// hotfix: mobile layer control UX
// hotfix: map canvas print selector
// trigger sync for realtime hero stats
