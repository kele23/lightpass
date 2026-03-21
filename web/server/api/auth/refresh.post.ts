import { SignJWT, jwtVerify } from 'jose';
import { defineEventHandler, HTTPError, readBody, setCookie } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { UserRefreshPayload } from '../../../types/user.ts';
import { getUserOrThrow } from '../../utils/user.ts';

export type RefreshBody = {
  refreshToken: string;
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<RefreshBody>(event);
  if (!body) throw new HTTPError('Sorry, you have to provide refresh token to refresh', { status: 401 });

  const secret = new TextEncoder().encode(config.jwtSecret);

  let inToken: UserRefreshPayload;
  try {
    const { payload } = await jwtVerify(body.refreshToken, secret);
    inToken = payload as unknown as UserRefreshPayload;
  } catch (err) {
    throw new HTTPError('Invalid login', { status: 400 });
  }

  if (!inToken.refresh) throw new HTTPError('Invalid refresh token', { status: 400 });

  // load user by name
  const user = await getUserOrThrow(inToken.name, event);

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
