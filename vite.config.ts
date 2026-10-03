import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: '/',
    build: {
      outDir: 'dist',
      modulePreload: false,
      emptyOutDir: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 5000,
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        maxParallelFileOps: 2,
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('/node_modules/react/') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('/node_modules/react-router/') ||
                id.includes('/node_modules/react-router-dom/')
              ) {
                return 'vendor-react-core';
              }
              if (id.includes('@turf')) {
                return 'vendor-turf';
              }
              if (id.includes('maplibre-gl') || id.includes('mapbox-gl')) {
                return 'vendor-maplibre';
              }
              if (id.includes('supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'vendor-pdf';
              }
              if (id.includes('lucide-react') || id.includes('recharts')) {
                return 'vendor-ui-charts';
              }
              if (id.includes('framer-motion') || id.includes('/node_modules/motion/')) {
                return 'vendor-motion';
              }
            }
          },
        },
      },
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        workbox: {
          cleanupOutdatedCaches: true, // WAJIB ADA: Membersihkan cache lama mencegah error IDB
          clientsClaim: true,
          skipWaiting: true,
          globIgnores: ['**/*.json'],
          maximumFileSizeToCacheInBytes: 8388608, // 8 MiB to accommodate bundles
          navigateFallbackDenylist: [/^\/api/],
        },
        manifest: {
          name: 'Portal Investasi Luwu',
          short_name: 'InvestLuwu',
          description: 'Sistem Informasi Spasial Potensi Investasi Kabupaten Luwu',
          theme_color: '#020617',
          background_color: '#020617',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router',
        'react-router-dom',
        'react-i18next',
        'motion',
        'framer-motion',
        '@turf/turf',
        'maplibre-gl'
      ],
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client',
        'react-router',
        'react-router-dom',
        '@supabase/supabase-js',
        'lucide-react',
        'maplibre-gl',
        'recharts',
        'sweetalert2',
        'i18next',
        'react-i18next',
        'i18next-browser-languagedetector',
        'motion',
        'motion/react',
        '@turf/turf'
      ],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: false,
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
// trigger sync code freeze v1.0.0
