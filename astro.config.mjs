// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://viskawei.github.io',
  base: '/',
  integrations: [react()],
  build: {
    assets: '_assets',
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
            if (id.includes('node_modules/d3')) return 'd3';
            if (id.includes('node_modules/react')) return 'react';
          },
        },
      },
    },
  },
});
