import { HTTPError } from 'nitro/h3';
import { User } from '../../types/user.ts';
import type { CouchClient } from './couch.ts';

/**
 * Check if username password belong to user
 * @param {name, password} The user credentials
 * @param couchUrl The base CouchDB url
 * @returns true if login successful
 */
export const checkLogin = async (
  { name, password }: { name: string; password: string },
  couchUrl: string,
): Promise<boolean> => {
  try {
    // Creiamo il token di base auth (disponibile nativamente in Node 18+ e ambienti Edge)
    const credentials = btoa(`${name}:${password}`);

    // Chiamiamo l'endpoint _session di CouchDB
    const response = await fetch(`${couchUrl}/_session`, {
      method: 'GET', // CouchDB supporta GET o POST su _session
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${credentials}`,
      },
    });

    // Se la risposta è 200 OK, le credenziali sono valide.
    // Se è 401 Unauthorized, non lo sono.
    return response.ok;
  } catch (e) {
    // Errore di rete o server irraggiungibile
    return false;
  }
};

/**
 * Recupera un utente dal database _users
 * @param name The username
 * @param couch The CouchClient instance
 * @returns The user if found, undefined if not found
 */
export const getUser = async (name: string, couch: CouchClient): Promise<User | undefined> => {
  try {
    // Usiamo encodeURIComponent per sicurezza, nel caso il nome contenga caratteri speciali
    const docId = encodeURIComponent(`org.couchdb.user:${name}`);

    // Richiamiamo direttamente il path del db e l'id del documento
    const user = await couch.request<User>(`/_users/${docId}`);

    return user;
  } catch (e) {
    // Il nostro CouchClient lancia un errore se lo status non è OK (es. 404 Not Found)
    return undefined;
  }
};

/**
 * Recupera un utente o lancia un'eccezione
 * @param name The username
 * @param couch The CouchClient instance
 * @returns The user if found
 * @throws HTTPError se l'utente non viene trovato
 */
export const getUserOrThrow = async (name: string, couch: CouchClient): Promise<User> => {
  const user = await getUser(name, couch);

  if (!user) {
    throw new HTTPError('User not found', { status: 401 });
  }

  return user;
};
