import PouchDB from 'pouchdb';
import { effect, ref } from 'vue';
import { PartialTime, Time } from '../interfaces/db.ts';

const timesDB = new PouchDB<Time>('lightpass_times');
const times = ref<Time[]>([]);

const getTime = async (_id: string): Promise<Time> => {
    const time = await timesDB.get(_id);
    return time;
};

const addTime = async (pTime: PartialTime): Promise<Time> => {
    const _id = pTime.time + '-' + Math.ceil(Math.random() * 1000);

    const timeObj: Time = {
        _id,
        time: pTime.time,
    };

    // add new time
    const resp = await timesDB.put(timeObj);
    return { ...timeObj, _rev: resp.rev };
};

const removeTime = async (_id: string) => {
    const time = await timesDB.get<Time>(_id);
    await timesDB.remove(time);
};

effect(async () => {
    let tmp = [] as Time[];

    const docs = await timesDB.allDocs<Time>({ include_docs: true });
    for (const doc of docs.rows) {
        tmp.push(doc.doc!);
    }

    // finish
    times.value = tmp;
});

// listen to times change
timesDB
    .changes<Time>({
        since: 'now',
        live: true,
        include_docs: true,
    })
    .on('change', (changes) => {
        if (changes.deleted) {
            times.value = times.value.filter((item) => item._id != changes.id);
        } else if (changes.doc) {
            times.value = [...times.value, changes.doc];
            console.log('>>>>>>> New time ', new Date(changes.doc.time), changes.doc.time);
        }
    });

export function useTimes() {
    return { times, addTime, removeTime };
}
