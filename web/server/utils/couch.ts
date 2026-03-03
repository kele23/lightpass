import nano from 'nano';
import { useRuntimeConfig } from 'nitro/runtime-config';
import crypto from 'crypto';

let couchInstance: nano.ServerScope | null = null;

export function useCouch(): nano.ServerScope {
  if (couchInstance) {
    return couchInstance;
  }

  const config = useRuntimeConfig();
  const hash = crypto.createHmac('sha256', config.couchSecret);
  hash.update(config.couchUser);
  const token = hash.digest('hex');

  // create couch intance
  couchInstance = nano({
    url: config.couchUrl,
    headers: {
      'X-Auth-CouchDB-UserName': config.couchUser,
      'X-Auth-CouchDB-Roles': '_admin',
      'X-Auth-CouchDB-Token': token,
    },
  });

  return couchInstance;
}
