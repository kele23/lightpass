import crypto from 'crypto';
import { createError, defineEventHandler, getProxyRequestHeaders } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { verifyJWT } from '../../utils/auth.ts';

export default defineEventHandler(async (event) => {
  const user = await verifyJWT(event);
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

  // Determiniamo il fetch (VPC su Cloudflare oppure globale in dev)
  let internalFetch = globalThis.fetch;
  const env = (event as any)?.runtime?.cloudflare?.env;
  if (env?.VPC_SERVICE) {
    internalFetch = env.VPC_SERVICE.fetch.bind(env.VPC_SERVICE);
  }

  // Costruiamo gli header request replicando il comportamento di H3 proxyRequest
  const fetchHeaders = new Headers(getProxyRequestHeaders(event));
  for (const [key, value] of Object.entries(proxyHeaders)) {
    fetchHeaders.set(key, value);
  }

  const method = event.req.method;
  const payloadMethods = new Set(['PATCH', 'POST', 'PUT', 'DELETE']);
  const requestBody = payloadMethods.has(method) ? event.req.body : undefined;

  let response: Response;
  try {
    response = await internalFetch(targetUrl, {
      method,
      body: requestBody,
      duplex: requestBody ? 'half' : undefined,
      headers: fetchHeaders,
    } as RequestInit);
  } catch (error) {
    throw createError({ statusCode: 502, cause: error });
  }

  // Filtriamo gli header response esattamente come fa H3 proxy
  const responseHeaders = new Headers();
  for (const [key, value] of response.headers.entries()) {
    if (key === 'content-encoding' || key === 'content-length' || key === 'transfer-encoding') {
      continue;
    }
    responseHeaders.append(key, value);
  }

  // Ritorniamo la Response costruita nativamente per H3
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
});
