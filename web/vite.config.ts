import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa';

const certs = !!process.env.MACHINE_CERT;

const config = {
    plugins: [
        vue(),
        VitePWA({
            injectRegister: 'auto',
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
            },
            manifest: {
                name: 'Lightpass V4',
                short_name: 'Lightpass',
                description: 'Racing system',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'pwa-64x64.png',
                        sizes: '64x64',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'maskable-icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
        }),
    ],
    server: {
        https: certs
            ? {
                  key: fs.readFileSync(process.env.MACHINE_KEY as string),
                  cert: fs.readFileSync(process.env.MACHINE_CERT as string),
              }
            : undefined,
        proxy: {
            '/couchdb': {
                secure: false,
                target: 'https://kele23.tplinkdns.com:8563/',
            },
            '/api': {
                secure: false,
                target: 'https://kele23.tplinkdns.com:8563/',
            },
        },
    },
};

// https://vitejs.dev/config/
export default defineConfig(config);
