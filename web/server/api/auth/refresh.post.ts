import jwt from 'jsonwebtoken';
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

  const inToken = jwt.verify(body.refreshToken, config.jwtSecret) as UserRefreshPayload;
  if (!inToken) throw new HTTPError('Invalid login', { status: 400 });
  if (!inToken.refresh) throw new HTTPError('Invalid refresh token', { status: 400 });

  // load user by name
  const user = await getUserOrThrow(inToken.name, event);

  // Main token
  const token = jwt.sign(
    {
      sub: user.name,
      name: user.name,
      roles: user.roles,
    },
    config.jwtSecret,
    { expiresIn: '10m' },
  );

  // Refresh token
  const refreshToken = jwt.sign(
    {
      name: user.name,
      refresh: true,
    },
    config.jwtSecret,
    { expiresIn: '1d' },
  );

  // Set cookie
  setCookie(event, 'token', token, {
    path: '/',
    secure: config.secureCookies,
    httpOnly: true,
    sameSite: true,
  });

  return { refreshToken };
});
