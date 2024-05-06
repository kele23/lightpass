import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), mkcert()],
    server: {
        https: true,
        proxy: {
            '/api/db': {
                target: 'http://192.168.68.122:5984/',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/db/, ''),
            },
        },
    },
});
