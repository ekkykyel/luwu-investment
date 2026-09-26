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
      chunkSizeWarningLimit: 5000,
      sourcemap: false,
      minify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('maplibre-gl') || id.includes('mapbox-gl')) {
                return 'vendor-maplibre';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'vendor-pdf';
              }
              if (id.includes('supabase')) {
                return 'vendor-supabase';
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
          maximumFileSizeToCacheInBytes: 5242880, // 5 MiB to accommodate the large index chunk
          navigateFallbackDenylist: [/^\/api/],
        },
        manifest: {
          name: 'Portal Investasi Luwu',
          short_name: 'InvestLuwu',
          description: 'Sistem Informasi Spasial Potensi Investasi Kabupaten Luwu',
          theme_color: '#4f46e5',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom', 'react-i18next', 'motion', 'framer-motion'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@turf/turf': path.resolve(__dirname, './src/utils/turf-shim.ts'),
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
        'motion/react'
      ],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.NODE_ENV === 'development' ? {
        clientPort: 443
      } : false,
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
