import crypto from 'crypto';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { logger } from './logger.ts';

export interface CouchClient {
  request: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
}

let couchInstance: CouchClient | null = null;

export function useCouch(): CouchClient {
  if (couchInstance) {
    return couchInstance;
  }

  const config = useRuntimeConfig();
  const hash = crypto.createHmac('sha256', config.couchSecret);
  hash.update(config.couchUser);
  const token = hash.digest('hex');

  const baseUrl = config.couchUrl;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Auth-CouchDB-UserName': config.couchUser,
    'X-Auth-CouchDB-Roles': '_admin',
    'X-Auth-CouchDB-Token': token,
  };

  couchInstance = {
    request: async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      const url = new URL(endpoint, baseUrl);

      logger.info(`CouchDB Request: ${url.toString()}`);
      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CouchDB Error [${response.status}]: ${errorText}`);
      }

      return response.json() as Promise<T>;
    },
  };

  return couchInstance;
}
