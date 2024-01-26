import { MaybeRefOrGetter, ref, toValue, watch } from 'vue';
import { PS } from '../interfaces/db.ts';
import { Score } from '../interfaces/score.ts';
import { emitter } from '../services/db.ts';
import { calculateScore, scoreSorter } from '../utils/score.ts';
import { useRace } from './useRace.ts';

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
            emitter.on('db:change', onDbChange);
            reset.value++;

            onCleanup(() => {
                emitter.off('put', onDbChange);
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
