import { defineConfig } from 'nitro';

export default defineConfig({
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
