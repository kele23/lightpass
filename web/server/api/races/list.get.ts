import { defineEventHandler } from 'nitro/h3';
import { Race } from '../../../types/races.ts';
import { verifyJWT } from '../../utils/auth.ts';
import { useCouch } from '../../utils/couch.ts';
import { AllDocsResponse } from '../../../types/iditem.ts';

export default defineEventHandler(async (event): Promise<Race[]> => {
  const user = verifyJWT(event);
  const couch = useCouch(user, event);

  // /_all_dbs ritorna direttamente un array di stringhe
  const dblist = await couch.request<AllDocsResponse<Race>>('/lightpass-dbs/_all_docs?include_docs=true');
  const result: Race[] = [];

  for (const dbName of dblist.rows) {
    if (dbName.doc) result.push(dbName.doc);
  }

  return result;
});
