import { defineEventHandler, deleteCookie } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { verifyJWT } from '../../utils/auth.ts';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // verify login before logout
  await verifyJWT(event);

  deleteCookie(event, 'token', {
    path: '/',
    secure: config.secureCookies,
    httpOnly: true,
    sameSite: true,
  });

  return { ok: true };
});
