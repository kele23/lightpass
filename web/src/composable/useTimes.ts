import { effect, ref, watchEffect } from 'vue';
import { PartialTime, RACES_TYPES, Time } from '../interfaces/db.ts';
import { createKey, getFiltersForType, getMachineId } from '../services/utils.ts';
import { useRace } from './useRace.ts';

const { raceDB } = useRace();

const times = ref<Time[]>([]);

watchEffect((onCleanup) => {
  let changes = undefined;
  if (raceDB.value) {
    changes = raceDB.value
      .changes<Time>({
        since: 'now',
        live: true,
        include_docs: true,
      })
      .on('change', (changes) => {
        if (!changes.id.startsWith(RACES_TYPES.TIME)) return;

        if (changes.deleted) {
          times.value = times.value.filter((item) => item._id != changes.id);
        } else if (changes.doc) {
          if (changes.doc.deviceId === getMachineId()) {
            const existingIndex = times.value.findIndex(t => t._id === changes.id);
            if (existingIndex >= 0) {
              const newTimes = [...times.value];
              newTimes[existingIndex] = changes.doc;
              times.value = newTimes;
              console.log(`>>>>>>> Updated Time ${changes.doc.time} (${changes.doc.deviceId})`);
            } else {
              times.value = [...times.value, changes.doc];
              console.log(`>>>>>>> New Time ${changes.doc.time} (${changes.doc.deviceId})`);
            }
          }
        }
      });
  }

  onCleanup(() => {
    console.log('cleanup times listener');
    changes?.cancel();
  });
});

effect(async () => {
  if (!raceDB.value) return;
  let tmp = [] as Time[];

  const docs = await raceDB.value.allDocs<Time>({
    include_docs: true,
    ...getFiltersForType(RACES_TYPES.TIME),
  });

  const machineId = getMachineId();
  for (const doc of docs.rows) {
    if (doc.doc?.deviceId === machineId) {
      tmp.push(doc.doc!);
    }
  }

  // finish
  times.value = tmp;
});

export function useTimes() {
  const addTime = async (pTime: PartialTime): Promise<Time> => {
    if (!raceDB.value) throw new Error('Cannot add time without a race selected');

    const _id = createKey(RACES_TYPES.TIME, pTime.time + '-' + pTime.deviceId);

    const timeObj: Time = {
      _id,
      deviceId: getMachineId(),
      time: pTime.time,
    };

    // add new time
    const resp = await raceDB.value.put(timeObj);
    return { ...timeObj, _rev: resp.rev };
  };

  const removeTime = async (_id: string) => {
    if (!raceDB.value) throw new Error('Cannot remove time without a race selected');

    const time = await raceDB.value.get<Time>(_id);
    if (time) {
      await raceDB.value.remove(time);
    }
  };

  return { times, addTime, removeTime };
}
