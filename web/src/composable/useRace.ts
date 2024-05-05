import { effect, ref, shallowRef } from 'vue';
import { IDItem, PS, PartialRace, Race, Runner, Take } from '../interfaces/db.ts';
import { cleanKey } from '../services/utils.ts';
import { _t } from '../services/dictionary.ts';
import useToasterStore from '../stores/toaster.ts';
import PouchDB from 'pouchdb';

export const racesDB = new PouchDB<Race>('lightpass_races');
export const currentRace = ref<Race>();
export const races = ref<Race[]>([]);
export const raceDB = shallowRef<PouchDB.Database<IDItem | PS | Runner | Take>>();

const addRace = async (pRace: PartialRace) => {
    const toasterStore = useToasterStore();
    const _id = cleanKey(pRace.name);

    let found = undefined;
    try {
        found = await racesDB.get(_id);
    } catch (ignored) {}

    if (found) {
        toasterStore.error({ text: _t('Race <b>{0}</b> already exist', pRace.name) });
        throw `Race ${_id} already exist`;
    }

    const race: Race = {
        _id,
        ...pRace,
    };

    const newRace = await racesDB.put(race);
    return { ...race, _rev: newRace.rev } as Race;
};

const removeRace = async (_id: string) => {
    const found = await racesDB.get(_id);
    if (found) {
        racesDB.remove(found);
    }
};

const setCurrentRace = async (_id: string) => {
    const found = await racesDB.get(_id);
    if (found) {
        raceDB.value = new PouchDB<IDItem | PS | Runner | Take>(`lightpass_race_${_id}`);
        currentRace.value = found;
    }
};

effect(async () => {
    let tmp = [] as Race[];

    const docs = await racesDB.allDocs<Race>({ include_docs: true });
    for (const doc of docs.rows) {
        tmp.push(doc.doc!);
    }

    // finish
    races.value = tmp;
});

// listen to race change
racesDB
    .changes<Race>({
        since: 'now',
        live: true,
        include_docs: true,
    })
    .on('change', (changes) => {
        if (changes.deleted) {
            races.value = races.value.filter((item) => item._id != changes.id);
        } else if (changes.doc) {
            races.value = [...races.value, changes.doc];
            console.log('>>>>>>> New race ', changes.doc.name);
        }
    });

export function useRace() {
    return { races, currentRace, addRace, removeRace, setCurrentRace };
}
