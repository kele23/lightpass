import { defineConfig } from 'nitro';

export default defineConfig({
  compatibilityDate: '2026-03-21',
  preset: 'cloudflare_module',
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
  },
  serverDir: './server',
  runtimeConfig: {
    couchSecret: 'secret-di-default',
    jwtSecret: 'secret-di-default',
    couchUrl: 'http://localhost:5984',
    racePrefix: 'race',
    couchAdminRole: '_admin',
    lgAdminRole: 'lightpass_admin',
    lgStandardRole: 'lightpass_user',
  },
});
