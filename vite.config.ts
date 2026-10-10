import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';

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
    ],
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://yeezhpdgafbefwipmldl.supabase.co"),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_nycP7MydQUR1hT7lOCRD5w_HCdldhgN"),
      'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || "https://yeezhpdgafbefwipmldl.supabase.co"),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || "sb_publishable_nycP7MydQUR1hT7lOCRD5w_HCdldhgN"),
      'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_nycP7MydQUR1hT7lOCRD5w_HCdldhgN"),
    },
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
        '@': fileURLToPath(new URL('./src', import.meta.url)),
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
      ws: false,
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
