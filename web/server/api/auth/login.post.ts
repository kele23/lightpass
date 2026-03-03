import jwt from 'jsonwebtoken';
import { defineEventHandler, HTTPError, readBody, setCookie } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { checkLogin, getUserOrThrow } from '../../utils/user.ts';
import { useCouch } from '../../utils/couch.ts';

export type UserLoginBody = {
  name: string;
  password: string;
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<UserLoginBody>(event);
  if (!body) throw new HTTPError('Sorry, you have to provide username & password to login', { status: 401 });

  const ok = await checkLogin(body, config.couchUrl);
  if (!ok) throw new HTTPError('Invalid login', { status: 400 });

  const couch = useCouch();
  const user = await getUserOrThrow(body.name, couch);

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
