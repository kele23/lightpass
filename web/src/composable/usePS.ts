import { effect, ref, watch, watchEffect } from 'vue';
import { IDItem, PS, PartialPS, RACES_TYPES } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import { createKey, getFiltersForType } from '../services/utils.ts';
import useToasterStore from '../stores/toaster.ts';
import { raceDB } from './useRace.ts';

const pss = ref<PS[]>([]);

watchEffect((onCleanup) => {
    let changes = undefined;
    if (raceDB.value) {
        changes = raceDB.value
            .changes<PS>({
                since: 'now',
                live: true,
                include_docs: true,
            })
            .on('change', (changes) => {
                if (!changes.id.startsWith(RACES_TYPES.PS)) return;

                if (changes.deleted) {
                    pss.value = pss.value.filter((item) => item._id != changes.id);
                } else if (changes.doc) {
                    pss.value = [...pss.value, changes.doc];
                    console.log('>>>>>>> New PS ', changes.doc.name);
                }
            });
    }

    onCleanup(() => {
        console.log('cleanup ps listener');
        changes?.cancel();
    });
});

effect(async () => {
    if (!raceDB.value) return;
    let tmp = [] as PS[];

    const docs = await raceDB.value.allDocs<PS>({
        include_docs: true,
        ...getFiltersForType(RACES_TYPES.PS),
    });

    for (const doc of docs.rows) {
        tmp.push(doc.doc!);
    }

    // finish
    pss.value = tmp;
});

const addPS = async (pPs: PartialPS): Promise<PS> => {
    if (!raceDB.value) throw new Error('Cannot add ps without a race selected');

    const _id = createKey(RACES_TYPES.PS, pPs.name);
    let found = undefined;
    try {
        found = await raceDB.value.get(_id);
    } catch (ignored) {}

    if (found) {
        useToasterStore().error({ text: _t('PS <b>{0}</b> already exist', pPs.name) });
        throw `PS ${_id} already exist`;
    }

    const ps: PS = {
        _id,
        ...pPs,
    };

    const resp = await raceDB.value.put(ps);
    return {
        ...ps,
        _rev: resp.rev,
    } as PS;
};

const removePS = async (_id: string) => {
    if (!raceDB.value) throw new Error('Cannot remove ps without a race selected');

    const ps = await raceDB.value.get<PS>(_id);
    if (ps) {
        await raceDB.value.remove(ps);
    }
};

const cleanPSs = async () => {
    if (!raceDB.value) throw new Error('Cannot clean PSs without a race selected');

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

    // pss
    const itemsPSs = await raceDB.value.allDocs<IDItem>({
        ...getFiltersForType(RACES_TYPES.PS),
    });
    const toDeletePS = itemsPSs.rows.map((item) => ({
        _id: item.id,
        _rev: item.doc?._rev,
        deleted: true,
    }));
    await raceDB.value.bulkDocs(toDeletePS);
};

export function usePS() {
    return {
        pss,
        addPS,
        removePS,
        cleanPSs,
    };
}
