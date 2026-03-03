import crypto from 'crypto';
import { defineEventHandler, proxyRequest } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { verifyJWT } from '../../utils/auth.ts';

export default defineEventHandler(async (event) => {
  const user = verifyJWT(event);
  const config = useRuntimeConfig();

  // generate couch db credentials
  const hash = crypto.createHmac('sha256', config.couchSecret);
  hash.update(user.name);
  const couchToken = hash.digest('hex');

  // generate authentication headers
  const proxyHeaders = {
    'X-Auth-CouchDB-UserName': user.name,
    'X-Auth-CouchDB-Roles': user.roles.join(','),
    'X-Auth-CouchDB-Token': couchToken,
  };

  // create real path
  const path = event.url.pathname + event.url.search;
  const targetPath = path.replace(/^\/couch/, '');
  const targetUrl = `${config.couchUrl}${targetPath}`;

  return proxyRequest(event, targetUrl, {
    headers: proxyHeaders,
  });
});
