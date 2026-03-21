import { verifyJWT } from '../../utils/auth.ts';
import { defineEventHandler } from 'nitro/h3';

export default defineEventHandler(async (event) => {
  const user = await verifyJWT(event, true);
  return user;
});
