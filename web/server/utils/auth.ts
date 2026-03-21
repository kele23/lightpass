import { jwtVerify } from 'jose';
import { H3Event, HTTPError, getCookie } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { UserTokenPayload } from '../../types/user.ts';

// verify if JWT is OK
export async function verifyJWT(event: H3Event, silent = false): Promise<UserTokenPayload> {
  const config = useRuntimeConfig();
  const token = getCookie(event, 'token');

  if (!token) {
    throw new HTTPError('Unauthorized: Missing token', { status: 401, data: { silent } });
  }

  try {
    const secret = new TextEncoder().encode(config.jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    const userPayload = payload as unknown as UserTokenPayload;
    event.context.user = userPayload;
    return userPayload;
  } catch (err) {
    throw new HTTPError('Unauthorized: Invalid token', { status: 401, data: { silent } });
  }
}

// verify if user is an administrator
export async function verifyAdministrator(event: H3Event, silent = false): Promise<UserTokenPayload> {
  const config = useRuntimeConfig();
  const user = await verifyJWT(event, silent);

  if (!user.roles.includes(config.lgAdminRole)) {
    throw new HTTPError('User not administrator, required administrator role to continue', {
      status: 403,
      data: { silent },
    });
  }

  return user;
}
