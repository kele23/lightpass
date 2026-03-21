import { SignJWT } from 'jose';
import { defineEventHandler, HTTPError, readBody, setCookie } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { checkLogin, getUserOrThrow } from '../../utils/user.ts';

export type UserLoginBody = {
  name: string;
  password: string;
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const body = await readBody<UserLoginBody>(event);
  if (!body) throw new HTTPError('Sorry, you have to provide username & password to login', { status: 401 });

  // check login
  const ok = await checkLogin(body, event);
  if (!ok) throw new HTTPError('Invalid login', { status: 400 });

  // load user by name
  const user = await getUserOrThrow(body.name, event);

  const secret = new TextEncoder().encode(config.jwtSecret);

  // Main token
  const token = await new SignJWT({
    sub: user.name,
    name: user.name,
    roles: user.roles,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(secret);

  // Refresh token
  const refreshToken = await new SignJWT({
    name: user.name,
    refresh: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(secret);

  // Set cookie
  setCookie(event, 'token', token, {
    path: '/',
    secure: config.secureCookies,
    httpOnly: true,
    sameSite: true,
  });

  return { refreshToken };
});
