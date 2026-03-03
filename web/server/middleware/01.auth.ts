import { defineEventHandler, HTTPError } from 'nitro/h3';
import { verifyJWT } from '../utils/auth.ts';

export default defineEventHandler((event) => {
  // load path
  const path = event.url.pathname;
  if (!path.startsWith('/api/')) {
    return;
  }
  if (path.startsWith('/api/auth/')) {
    return;
  }

  // protect all API but not /api/auth/*
  try {
    const user = verifyJWT(event);
    event.context.user = user;
  } catch (error) {
    throw new HTTPError('Unauthorized: Invalid login', { status: 403 });
  }
});
