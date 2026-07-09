import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  base: '/mi-album/', // GitHub Pages
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mi Álbum',
        short_name: 'Mi Álbum',
        description: 'Gestor de colecciones de láminas: tracking, estadísticas e intercambios.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/mi-album/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@ui': path.resolve(__dirname, 'src/ui'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
});
