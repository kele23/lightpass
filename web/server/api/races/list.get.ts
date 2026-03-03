// server/api/races/index.get.ts
import { defineEventHandler } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { Race } from '../../../types/races.ts';
import { useCouch } from '../../utils/couch.ts';

export default defineEventHandler(async (): Promise<Race[]> => {
  const config = useRuntimeConfig();
  const couch = useCouch();

  const dblist = await couch.db.list();
  const result: Race[] = [];

  for (const dbName of dblist) {
    if (!dbName.startsWith(config.racePrefix)) continue;

    const db = couch.use(dbName);
    try {
      const info = (await db.get('raceinfo')) as Race;
      result.push({ name: info.name, _id: dbName });
    } catch (ignored) {}
  }

  return result;
});
