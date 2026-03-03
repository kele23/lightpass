import { defineEventHandler } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { Race } from '../../../types/races.ts';
import { useCouch } from '../../utils/couch.ts';

export default defineEventHandler(async (): Promise<Race[]> => {
  const config = useRuntimeConfig();
  const couch = useCouch();

  // /_all_dbs ritorna direttamente un array di stringhe
  const dblist = await couch.request<string[]>('/_all_dbs');
  const result: Race[] = [];

  for (const dbName of dblist) {
    if (!dbName.startsWith(config.racePrefix)) continue;

    try {
      // Effettuiamo una GET diretta sul documento 'raceinfo'
      const info = await couch.request<Race>(`/${dbName}/raceinfo`);
      result.push({ name: info.name, _id: dbName });
    } catch (ignored) {
      // Ignora l'errore se il documento 'raceinfo' non esiste in questo database
    }
  }

  return result;
});
