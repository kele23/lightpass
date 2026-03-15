import jwt from 'jsonwebtoken';
import { H3Event, HTTPError, getCookie } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { UserTokenPayload } from '../../types/user.ts';

// verify if JWT is OK
export function verifyJWT(event: H3Event, silent = false): UserTokenPayload {
  const config = useRuntimeConfig();
  const token = getCookie(event, 'token');

  if (!token) {
    throw new HTTPError('Unauthorized: Missing token', { status: 401, data: { silent } });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as UserTokenPayload;
    event.context.user = payload;
    return payload;
  } catch (err) {
    throw new HTTPError('Unauthorized: Invalid token', { status: 401, data: { silent } });
  }
}

// verify if user is an administrator
export function verifyAdministrator(event: H3Event, silent = false): UserTokenPayload {
  const config = useRuntimeConfig();
  const user = verifyJWT(event);

  if (!user.roles.includes(config.lgAdminRole)) {
    throw new HTTPError('User not administrator, required administrator role to continue', {
      status: 403,
      data: { silent },
    });
  }

  return user;
}
