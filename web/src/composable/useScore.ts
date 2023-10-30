import { MaybeRefOrGetter, ref, toValue, watch } from 'vue';
import { PS } from '../interfaces/db';
import { Score } from '../interfaces/score';
import { getTakesLevel } from '../services/db';
import { useRace } from './useRace';
import { calculateScore, scoreSorter } from '../utils/score';

export function useScore(selectedPS: MaybeRefOrGetter<PS | undefined>) {
    const { currentRace } = useRace();
    const reset = ref(0);
    const score = ref([] as Score[]);

    function onDbChange() {
        reset.value++;
    }

    watch(
        currentRace,
        (_c, _o, onCleanup) => {
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

    watch([selectedPS], () => {
        reset.value++;
    });

    watch(reset, async () => {
        if (!currentRace || !currentRace.value) return;
        if (!selectedPS || !toValue(selectedPS)) return;

        const tmp = await calculateScore(toValue(selectedPS)!, currentRace.value);

        // order
        score.value = tmp.sort(scoreSorter);
    });

    return {
        score,
    };
}
