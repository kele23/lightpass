import { ref, watch } from 'vue';
import { PS } from '../interfaces/db.ts';
import { cleanKey, getPsLevel, getTakesLevel } from '../services/db.ts';
import { _t } from '../services/dictionary.ts';
import useToasterStore from '../stores/toaster.ts';
import { useRace } from './useRace.ts';

export function usePS() {
    const toasterStore = useToasterStore();
    const { currentRace } = useRace();
    const reset = ref(0);
    const pss = ref([] as PS[]);

    const onDbChange = () => {
        reset.value++;
    };

    watch(
        currentRace,
        (_c, _o, onCleanup) => {
            if (!currentRace || !currentRace.value) return;
            const psLevel = getPsLevel(currentRace.value._id!);
            psLevel.on('put', onDbChange);
            psLevel.on('del', onDbChange);
            psLevel.on('batch', onDbChange);
            reset.value++;

            onCleanup(() => {
                psLevel.off('put', onDbChange);
                psLevel.off('del', onDbChange);
                psLevel.off('batch', onDbChange);
            });
        },
        { immediate: true }
    );

    watch(reset, async () => {
        if (!currentRace || !currentRace.value) return;

        const psLevel = getPsLevel(currentRace.value._id!);

        // get from DB
        let tmp = [] as PS[];
        try {
            const iterator = psLevel.iterator();
            for await (const [key, value] of iterator) {
                const ps = {
                    _id: key,
                    ...value,
                } as PS;
                tmp.push(ps);
            }
        } catch (err) {
            console.error(err);
        }

        // finish
        pss.value = tmp;
    });

    return {
        pss,
        async addPS(ps: PS) {
            if (!currentRace || !currentRace.value) {
                toasterStore.error({ text: _t('No race selected') });
                throw `No race selected`;
            }

            const psLevel = getPsLevel(currentRace.value._id!);
            const _id = cleanKey(ps.name);

            const [found] = await psLevel.getMany([_id]);
            if (found) {
                toasterStore.error({ text: _t('PS <b>{0}</b> already exist', ps.name) });
                throw `PS ${_id} already exist`;
            }

            await psLevel.put(_id, ps);
            return {
                _id,
                ...ps,
            } as PS;
        },
        async removePS(_id: string) {
            if (!currentRace || !currentRace.value) {
                toasterStore.error({ text: _t('No race selected') });
                throw `No race selected`;
            }

            const psLevel = getPsLevel(currentRace.value._id!);
            const takesLevel = getTakesLevel(currentRace.value._id!);
            await psLevel.del(_id);
            await takesLevel.clear({ gte: _id, lt: _id + '~' });
        },
        async cleanPS() {
            if (!currentRace || !currentRace.value) {
                toasterStore.error({ text: _t('No race selected') });
                throw `No race selected`;
            }

            const psLevel = getPsLevel(currentRace.value._id!);
            const takesLevel = getTakesLevel(currentRace.value._id!);
            await psLevel.clear();
            await takesLevel.clear();
        },
    };
}
