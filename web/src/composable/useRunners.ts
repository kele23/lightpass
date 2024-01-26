import { ref, watch } from 'vue';
import { Runner } from '../interfaces/db.ts';
import { cleanKey, emitter, getRunnersLevel, getTakesLevel } from '../services/db.ts';
import { _t } from '../services/dictionary.ts';
import useToasterStore from '../stores/toaster.ts';
import { useRace } from './useRace.ts';

export function useRunners() {
    const toasterStore = useToasterStore();
    const { currentRace } = useRace();
    const reset = ref(0);
    const runners = ref([] as Runner[]);

    function onDbChange() {
        reset.value++;
    }

    watch(
        currentRace,
        (_c, _o, onCleanup) => {
            if (!currentRace || !currentRace.value) return;
            emitter.on('db:change', onDbChange);
            reset.value++;

            onCleanup(() => {
                emitter.off('put', onDbChange);
            });
        },
        { immediate: true }
    );

    watch(reset, async () => {
        if (!currentRace || !currentRace.value) return;

        const runnersLevel = getRunnersLevel(currentRace.value._id!);

        // get from DB
        let tmp = [] as Runner[];
        try {
            const iterator = runnersLevel.iterator();
            for await (const [key, value] of iterator) {
                const runner = {
                    _id: key,
                    ...value,
                } as Runner;
                tmp.push(runner);
            }
        } catch (err) {
            console.error(err);
        }

        // finish
        runners.value = tmp;
    });

    return {
        runners,
        async addRunner(runner: Runner) {
            if (!currentRace || !currentRace.value) {
                toasterStore.error({ text: _t('No race selected') });
                throw `No race selected`;
            }

            const runnersLevel = getRunnersLevel(currentRace.value._id!);
            const _id = cleanKey(runner.number.toString().padStart(10, '0'));

            const [found] = await runnersLevel.getMany([_id]);
            if (found) {
                toasterStore.error({ text: _t('Number <b>{0}</b> already exist', runner.number.toString()) });
                throw `Number ${_id} already exist`;
            }

            await runnersLevel.put(_id, runner);
            return {
                _id,
                ...runner,
            } as Runner;
        },
        async removeRunner(_id: string) {
            if (!currentRace || !currentRace.value) {
                toasterStore.error({ text: _t('No race selected') });
                throw `No race selected`;
            }

            const runnersLevel = getRunnersLevel(currentRace.value._id!);
            await runnersLevel.del(_id);
        },
        async cleanRunner() {
            if (!currentRace || !currentRace.value) {
                toasterStore.error({ text: _t('No race selected') });
                throw `No race selected`;
            }

            const runnersLevel = getRunnersLevel(currentRace.value._id!);
            await runnersLevel.clear();
            const takesLevel = getTakesLevel(currentRace.value._id!);
            await takesLevel.clear();
        },
    };
}
