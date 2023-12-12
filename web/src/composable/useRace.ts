import { computedAsync } from '@vueuse/core';
import { ref, watch, watchEffect } from 'vue';
import { Race } from '../interfaces/db.ts';
import { cleanKey, lightpassLevel } from '../services/db.ts';
import { _t } from '../services/dictionary.ts';
import { useStoreRace } from '../stores/race.ts';
import useToasterStore from '../stores/toaster.ts';

export function useRace() {
    const toasterStore = useToasterStore();
    const store = useStoreRace();
    const races = ref([] as Race[]);
    const reset = ref(0);

    const currentRace = computedAsync(async () => {
        let _id = store.race?._id;
        if (!_id) return undefined;
        const value = await lightpassLevel.get(_id);
        return {
            _id,
            ...value,
        } as Race;
    });

    const onDbChange = () => {
        reset.value++;
    };

    watchEffect((onCleanup) => {
        lightpassLevel.on('put', onDbChange);
        lightpassLevel.on('del', onDbChange);
        lightpassLevel.on('batch', onDbChange);

        onCleanup(() => {
            lightpassLevel.off('put', onDbChange);
            lightpassLevel.off('del', onDbChange);
            lightpassLevel.off('batch', onDbChange);
        });
    });

    watch(
        currentRace,
        () => {
            reset.value++;
        },
        { immediate: true }
    );

    watch(reset, async () => {
        let tmp = [] as Race[];
        try {
            //filter
            const iterator = lightpassLevel.keys();
            let keys = [] as string[];
            for await (const key of iterator) {
                if (key.indexOf('!') >= 0) continue;
                keys.push(key);
            }

            for (const key of keys) {
                const value = await lightpassLevel.get(key);
                tmp.push({
                    _id: key,
                    ...value,
                } as Race);
            }
        } catch (err) {
            console.error(err);
        }

        // finish
        races.value = tmp;
    });

    return {
        currentRace,
        races,
        async addRace(name: string) {
            const _id = cleanKey(name);

            const [found] = await lightpassLevel.getMany([_id]);
            if (found) {
                toasterStore.error({ text: _t('Race <b>{0}</b> already exist', name) });
                throw `Race ${_id} already exist`;
            }

            await lightpassLevel.put(_id, { name });
            return {
                _id,
                name,
            } as Race;
        },
        async removeRace(_id: string) {
            await lightpassLevel.del(_id);
        },
        async setCurrentRace(_id: string | undefined) {
            if (!_id) store.setCurrentRace(undefined);
            else {
                const value = await lightpassLevel.get(_id);
                store.setCurrentRace({
                    _id,
                    ...value,
                });
            }
        },
    };
}
