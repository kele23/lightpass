import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';

const certs = !!process.env.MACHINE_CERT;

const config = {
  plugins: [
    nitro(),
    tailwindcss(),
    vue(),
    // VitePWA({
    //   injectRegister: 'auto',
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
    //   },
    //   manifest: { ... },
    // }),
  ],

  define: {
    global: 'window',
  },

  resolve: {
    alias: {
      my_events: 'events',
    },
  },

  build: {
    minify: false,
  },

  server: {
    https: certs
      ? {
          key: fs.readFileSync(process.env.MACHINE_KEY as string),
          cert: fs.readFileSync(process.env.MACHINE_CERT as string),
        }
      : undefined,
  },
};

// https://vitejs.dev/config/
export default defineConfig(config);
