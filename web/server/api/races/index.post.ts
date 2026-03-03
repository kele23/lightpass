import { verifyAdministrator } from '../../utils/auth.ts';
import { defineEventHandler, HTTPError, readBody } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { useCouch } from '../../utils/couch.ts';
import { Race } from '../../../types/races.ts';

export type RaceCreateBodyType = {
  name: string;
};

export default defineEventHandler(async (event): Promise<Race> => {
  verifyAdministrator(event);

  const config = useRuntimeConfig();
  const couch = useCouch();

  // 2. Leggi il body
  const body = await readBody<RaceCreateBodyType>(event);
  if (!body || !body.name) {
    throw new HTTPError('Missing name', { status: 400 });
  }

  // 3. Converti il nome in uno slug utilizzabile
  let slug = body.name.replace(/\s+/g, '-').toLowerCase();
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // 4. Aggiungi il prefisso
  const dbName = `${config.racePrefix}_${slug}`;

  // 5. Crea il DB effettuando una PUT sull'endpoint col nome del DB
  await couch.request(`/${dbName}`, { method: 'PUT' });

  // Inserisci le info (essendo un ID fisso 'raceinfo', usiamo PUT)
  await couch.request(`/${dbName}/raceinfo`, {
    method: 'PUT',
    body: JSON.stringify({ name: body.name }),
  });

  // 6. Imposta i permessi di sicurezza su CouchDB
  await couch.request(`/${dbName}/_security`, {
    method: 'PUT',
    body: JSON.stringify({
      admins: { names: [], roles: ['_admin', config.adminRole] },
      members: { names: [], roles: [config.standardRole] },
    }),
  });

  // 7. Ritorna il risultato
  return { name: body.name, _id: dbName };
});
