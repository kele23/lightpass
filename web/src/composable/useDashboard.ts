import { Ref, ref, watch } from 'vue';
import { Take } from '../interfaces/db.ts';
import { Score } from '../interfaces/score.ts';
import { emitter, getPsLevel, getTakesLevel } from '../services/db.ts';
import { calculateScore } from '../utils/score.ts';
import { useRace } from './useRace.ts';

export function useDashboard(selectedPs: Ref<string | undefined>) {
    const { currentRace } = useRace();
    const reset = ref(0);
    const takes = ref([] as Take[]);
    const score = ref([] as Score[]);

    function onDbChange() {
        reset.value++;
    }

    watch(
        currentRace,
        (_c, _o, onCleanup) => {
            selectedPs.value = undefined; // reset selectedPS on currentRaceChange

            if (!currentRace || !currentRace.value) return;
            emitter.on('db:change', onDbChange);
            reset.value++;

            onCleanup(() => {
                emitter.off('put', onDbChange);
            });
        },
        { immediate: true }
    );

    watch([reset, selectedPs], async () => {
        if (!currentRace || !currentRace.value) return;

        const takesLevel = getTakesLevel(currentRace.value._id!);

        let options = { reverse: true } as object;
        if (selectedPs.value) {
            options = { gte: selectedPs.value, lt: selectedPs.value + '~', reverse: true };
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

    watch([reset, selectedPs], async () => {
        if (!currentRace || !currentRace.value) return;
        if (!selectedPs || !selectedPs.value) return;

        const psLevel = getPsLevel(currentRace.value._id!);

        let ps = undefined;
        try {
            const tmp = await psLevel.get(selectedPs.value);
            ps = {
                _id: selectedPs.value,
                ...tmp,
            };
        } catch (e) {
            return;
        }

        let limitedScore = [] as Score[];
        const tmp = await calculateScore(ps, currentRace.value);
        let index = 0;
        for (let i = tmp.length - 1; i >= 0; i--) {
            if (tmp[i].end) {
                index = i;
                break;
            }
        }

        for (let i = -3; i < 5; i++) {
            if (index + i < 0 || index + i >= tmp.length) continue;
            limitedScore.push(tmp[index + i]);
        }

        score.value = limitedScore.reverse();
    });

    return {
        takes,
        score,
    };
}
