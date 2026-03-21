import crypto from 'crypto';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { logger } from './logger.ts';
import { H3Event } from 'nitro/h3';

export interface CouchClient {
  request: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
}

export function useCouch(user: { name: string; roles: string[] }, event?: H3Event): CouchClient {
  const config = useRuntimeConfig();

  // create hashed token for user
  const hash = crypto.createHmac('sha256', config.couchSecret);
  hash.update(user.name);
  const token = hash.digest('hex');

  // set default headers for couchdb requests
  const baseUrl = config.couchUrl;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Auth-CouchDB-UserName': user.name,
    'X-Auth-CouchDB-Roles': user.roles.join(','),
    'X-Auth-CouchDB-Token': token,
  };

  // create couch client
  const couchInstance: CouchClient = {
    request: async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      const url = new URL(endpoint, baseUrl);

      // Check for VPC_SERVICE in Nitro's Cloudflare context bindings
      const env = (event?.context as any)?.cloudflare?.env;
      let internalFetch = globalThis.fetch;

      if (env?.VPC_SERVICE) {
        internalFetch = env.VPC_SERVICE.fetch.bind(env.VPC_SERVICE);
      }

      logger.info(`[COUCH] Request: ${url.toString()}`, event);
      const response = await internalFetch(url.toString(), {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      // check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CouchDB Error [${response.status}]: ${errorText}`);
      }

      // return response as json
      return response.json() as Promise<T>;
    },
  };

  return couchInstance;
}

/**
 * Get a couch client with administrative privilege for the user
 * @param userName The username that need administrative privilege
 * @returns The couch client with administrative privilege for the user
 */
export function useCouchAdmin(userName: string, event?: H3Event): CouchClient {
  const config = useRuntimeConfig();
  logger.info('Using couch admin for user ' + userName, event);
  return useCouch({ name: userName, roles: [config.couchAdminRole] }, event);
}
