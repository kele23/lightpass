import { defineConfig } from 'nitro';

export default defineConfig({
  compatibilityDate: '2024-09-19',
  preset: 'cloudflare_module',
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
  },
  serverDir: './server',
  runtimeConfig: {
    couchSecret: 'secret-di-default',
    jwtSecret: 'secret-di-default',
    couchUrl: 'https://kele23.tplinkdns.com:5984',
    couchUser: 'admin',
    racePrefix: 'race',
    adminRole: 'lightpass_admin',
    standardRole: 'lightpass_user',
  },
});
