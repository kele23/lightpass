import { defineEventHandler, HTTPError, readBody } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { Race } from '../../../types/races.ts';
import { verifyAdministrator } from '../../utils/auth.ts';
import { useCouchAdmin } from '../../utils/couch.ts';

export type RaceCreateBodyType = {
  name: string;
};

export default defineEventHandler(async (event): Promise<Race> => {
  const user = await verifyAdministrator(event);
  const config = useRuntimeConfig();
  const couch = useCouchAdmin(user.name, event);

  // 2. Leggi il body
  const body = await readBody<RaceCreateBodyType>(event);
  if (!body || !body.name) {
    throw new HTTPError('Missing name', { status: 400 });
  }

  // 3. Converti il nome in uno slug utilizzabile
  let slug = body.name.replace(/\s+/g, '-').toLowerCase();
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // 4. Aggiungi il prefisso e un id univoco
  const uniqueId = crypto.randomUUID().split('-')[0];
  const dbName = `${config.racePrefix}_${slug}_${uniqueId}`;

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
      admins: { names: [], roles: [config.couchAdminRole, config.lgAdminRole] },
      members: { names: [], roles: [config.lgStandardRole] },
    }),
  });

  // 6.5. Crea il Design Document per bloccare la scrittura ai lettori
  // Usiamo un template literal per iniettare i nomi dei ruoli dinamicamente nella stringa JS
  const validateDocUpdateFn = `
    function(newDoc, oldDoc, userCtx, secObj) {
      var isStandardUser = userCtx.roles.indexOf('${config.lgStandardRole}') !== -1;
      var isAdmin = userCtx.roles.indexOf('${config.lgAdminRole}') !== -1 || userCtx.roles.indexOf('_admin') !== -1;

      // Se l'utente ha il ruolo standard e NON è un admin, blocca l'aggiornamento
      if (isStandardUser && !isAdmin) {
        throw({ forbidden: 'Utente in sola lettura. Non hai i permessi per scrivere o modificare documenti.' });
      }
    }
  `;

  await couch.request(`/${dbName}/_design/controlli_accesso`, {
    method: 'PUT',
    body: JSON.stringify({
      validate_doc_update: validateDocUpdateFn.trim(),
    }),
  });

  // Crea il documento lightpass-dbs/dbName per renderlo visibile all'app
  await couch.request(`/lightpass-dbs/${dbName}`, {
    method: 'PUT',
    body: JSON.stringify({ name: body.name }),
  });

  // 7. Ritorna il risultato
  return { name: body.name, _id: dbName };
});
