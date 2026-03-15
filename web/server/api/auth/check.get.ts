import { verifyJWT } from '../../utils/auth.ts';
import { defineEventHandler } from 'nitro/h3';

export default defineEventHandler((event) => {
  const user = verifyJWT(event, true);
  return user;
});
