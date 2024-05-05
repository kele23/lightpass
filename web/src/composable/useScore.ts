import { MaybeRefOrGetter, ref } from 'vue';
import { PS } from '../interfaces/db.ts';
import { Score } from '../interfaces/score.ts';
import { useRace } from './useRace.ts';

export function useScore(selectedPS: MaybeRefOrGetter<PS | undefined>) {
    const { currentRace } = useRace();

    const score = ref([] as Score[]);

    // watch([selectedPS], () => {
    //     reset.value++;
    // });

    // watch(reset, async () => {
    //     if (!currentRace || !currentRace.value) return;
    //     if (!selectedPS || !toValue(selectedPS)) return;

    //     const tmp = await calculateScore(toValue(selectedPS)!, currentRace.value);

    //     // order
    //     score.value = tmp.sort(scoreSorter);
    // });

    return {
        score,
    };
}
