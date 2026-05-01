import { effect, ref, watchEffect } from 'vue';
import { PartialTake, RACES_TYPES, Take } from '../interfaces/db.ts';
import { createKey, getFiltersForType, getMachineId } from '../services/utils.ts';
import { useRace } from './useRace.ts';
import { useTimes } from './useTimes.ts';
import { IDItem } from '../../types/iditem.ts';

const { raceDB } = useRace();

const takes = ref<Take[]>([]);

watchEffect((onCleanup) => {
  let changes = undefined;
  if (raceDB.value) {
    changes = raceDB.value
      .changes<Take>({
        since: 'now',
        live: true,
        include_docs: true,
      })
      .on('change', (changes) => {
        if (!changes.id.startsWith(RACES_TYPES.TAKE)) return;

        if (changes.deleted) {
          takes.value = takes.value.filter((item) => item._id != changes.id);
        } else if (changes.doc) {
          const index = takes.value.findIndex((item) => item._id == changes.id);
          if (index !== -1) {
            takes.value[index] = changes.doc;
            takes.value = [...takes.value];
          } else {
            takes.value = [...takes.value, changes.doc];
          }
          console.log('>>>>>>> Take updated/added ', changes.id);
        }
      });
  }

  onCleanup(() => {
    console.log('cleanup take listener');
    changes?.cancel();
  });
});

effect(async () => {
  if (!raceDB.value) return;
  let tmp = [] as Take[];

  const docs = await raceDB.value.allDocs<Take>({
    include_docs: true,
    ...getFiltersForType(RACES_TYPES.TAKE),
  });

  for (const doc of docs.rows) {
    tmp.push(doc.doc!);
  }

  // finish
  takes.value = tmp;
});

export function useTakes() {
  const { addTime, removeTime } = useTimes();

  const addTake = async (pTake: PartialTake, timeId?: string): Promise<Take> => {
    if (!raceDB.value) throw new Error('Cannot add take without a race selected');

    const _id = createKey(RACES_TYPES.TAKE, pTake.ps + '-' + pTake.runner + '-' + pTake.type);
    let found = undefined;
    try {
      found = await raceDB.value.get(_id);
    } catch (ignored) {}

    if (found) {
      throw new Error(`Take ${_id} already exist`);
    }

    const take: Take = {
      _id,
      ...pTake,
    };

    if (timeId) {
      await removeTime(timeId);
    }

    const resp = await raceDB.value.put(take);
    return {
      ...take,
      _rev: resp.rev,
    } as Take;
  };

  const updateTake = async (take: Take): Promise<Take> => {
    if (!raceDB.value) throw new Error('Cannot update take without a race selected');
    const resp = await raceDB.value.put(take);
    return {
      ...take,
      _rev: resp.rev,
    };
  };

  const removeTake = async (_id: string) => {
    if (!raceDB.value) throw new Error('Cannot remove take without a race selected');

    const take = await raceDB.value.get<Take>(_id);
    if (take) {
      await raceDB.value.remove(take);
      if (take.time != null) {
        await addTime({ time: take.time, deviceId: getMachineId() });
      }
    }
  };

  const cleanTakes = async () => {
    if (!raceDB.value) throw new Error('Cannot clean Takes without a race selected');

    // takes
    const itemsTakes = await raceDB.value.allDocs<IDItem>({
      ...getFiltersForType(RACES_TYPES.TAKE),
    });
    const toDeleteTakes = itemsTakes.rows.map((item) => ({
      _id: item.id,
      _rev: item.doc?._rev,
      deleted: true,
    }));
    await raceDB.value.bulkDocs(toDeleteTakes);
  };

  return {
    takes,
    addTake,
    updateTake,
    removeTake,
    cleanTakes,
  };
}
