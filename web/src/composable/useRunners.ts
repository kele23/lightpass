import { effect, ref, watchEffect } from 'vue';
import { IDItem, PartialRunner, RACES_TYPES, Runner } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import { createKey, getFiltersForType } from '../services/utils.ts';
import useToasterStore from '../stores/toaster.ts';
import { useRace } from './useRace.ts';

const { raceDB } = useRace();

const runners = ref<Runner[]>([]);

watchEffect((onCleanup) => {
    let changes = undefined;
    if (raceDB.value) {
        changes = raceDB.value
            .changes<Runner>({
                since: 'now',
                live: true,
                include_docs: true,
            })
            .on('change', (changes) => {
                if (!changes.id.startsWith(RACES_TYPES.RUNNER)) return;

                if (changes.deleted) {
                    runners.value = runners.value.filter((item) => item._id != changes.id);
                } else if (changes.doc) {
                    runners.value = [...runners.value, changes.doc];
                    console.log('>>>>>>> New Runner ', changes.doc.name);
                }
            });
    }

    onCleanup(() => {
        console.log('cleanup runner listener');
        changes?.cancel();
    });
});

effect(async () => {
    if (!raceDB.value) return;
    let tmp = [] as Runner[];

    const docs = await raceDB.value.allDocs<Runner>({
        include_docs: true,
        ...getFiltersForType(RACES_TYPES.RUNNER),
    });

    for (const doc of docs.rows) {
        tmp.push(doc.doc!);
    }

    // finish
    runners.value = tmp;
});

export function useRunners() {
    const addRunner = async (pRunner: PartialRunner): Promise<Runner> => {
        if (!raceDB.value) throw new Error('Cannot add runner without a race selected');

        const _id = createKey(RACES_TYPES.RUNNER, pRunner.number.toString().padStart(10, '0'));
        let found = undefined;
        try {
            found = await raceDB.value.get(_id);
        } catch (ignored) {}

        if (found) {
            useToasterStore().error({ text: _t('Number <b>{0}</b> already exist', pRunner.number.toString()) });
            throw `Number ${_id} already exist`;
        }

        const runner: Runner = {
            _id,
            ...pRunner,
        };

        const resp = await raceDB.value.put(runner);
        return {
            ...runner,
            _rev: resp.rev,
        } as Runner;
    };

    const removeRunner = async (_id: string) => {
        if (!raceDB.value) throw new Error('Cannot remove runner without a race selected');

        const runner = await raceDB.value.get<Runner>(_id);
        if (runner) {
            await raceDB.value.remove(runner);
        }
    };

    const cleanRunners = async () => {
        if (!raceDB.value) throw new Error('Cannot clean runners without a race selected');

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

        // runners
        const itemsRunners = await raceDB.value.allDocs<IDItem>({
            ...getFiltersForType(RACES_TYPES.RUNNER),
        });
        const toDeleteRunners = itemsRunners.rows.map((item) => ({
            _id: item.id,
            _rev: item.doc?._rev,
            deleted: true,
        }));
        await raceDB.value.bulkDocs(toDeleteRunners);
    };

    return {
        runners,
        addRunner,
        removeRunner,
        cleanRunners,
    };
}
