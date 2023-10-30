import { ref, watch } from 'vue';
import { PS, Take } from '../interfaces/db';
import { getPsLevel, getTakesLevel } from '../services/db';
import { _t } from '../services/dictionary';
import useToasterStore from '../stores/toaster';
import { useRace } from './useRace';

export function useTakes() {
    const toasterStore = useToasterStore();
    const { currentRace } = useRace();
    const selectedPs = ref<PS>();
    const reset = ref(0);
    const takes = ref([] as Take[]);

    function onDbChange() {
        reset.value++;
    }

    watch(
        currentRace,
        (_c, _o, onCleanup) => {
            selectedPs.value = undefined; // reset selectedPS on currentRaceChange

            if (!currentRace || !currentRace.value) return;
            const takesLevel = getTakesLevel(currentRace.value._id!);
            takesLevel.on('put', onDbChange);
            takesLevel.on('del', onDbChange);
            takesLevel.on('batch', onDbChange);
            reset.value++;

            onCleanup(() => {
                takesLevel.off('put', onDbChange);
                takesLevel.off('del', onDbChange);
                takesLevel.off('batch', onDbChange);
            });
        },
        { immediate: true }
    );

    watch([reset, selectedPs], async () => {
        if (!currentRace || !currentRace.value) return;

        const takesLevel = getTakesLevel(currentRace.value._id!);

        let options = { reverse: true } as object;
        if (selectedPs.value) {
            options = { gte: selectedPs.value._id, lt: selectedPs.value._id + '~', reverse: true };
        }

        // get from DB
        let tmp = [] as Take[];
        try {
            const iterator = takesLevel.iterator(options);
            for await (const [key, value] of iterator) {
                const take = {
                    _id: key,
                    ...value,
                } as Take;
                tmp.push(take);
            }
        } catch (err) {
            console.error(err);
        }

        // finish
        takes.value = tmp;
    });

    return {
        takes,
        selectedPs,
        async selectPs(_id: string | undefined) {
            if (!currentRace || !currentRace.value) {
                toasterStore.error({ text: _t('No race selected') });
                throw `No race selected`;
            }

            if (!_id) {
                selectedPs.value = undefined;
                return;
            }

            const psLevel = getPsLevel(currentRace.value._id!);
            try {
                const ps = await psLevel.get(_id);
                selectedPs.value = { ...ps, _id };
            } catch (e) {
                toasterStore.error({ text: _t('PS {0} not found', _id) });
                throw `PS ${_id} not found`;
            }
        },
    };
}
