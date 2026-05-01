import { Ref, effect, ref } from 'vue';
import { PS } from '../interfaces/db.ts';
import { Score } from '../interfaces/score.ts';
import { calculateScore } from '../utils/score.ts';
import { useRunners } from './useRunners.ts';
import { useTakes } from './useTakes.ts';
import { usePS } from './usePS.ts';

export function useScore(selectedPS: Ref<PS | undefined>) {
    const { runners } = useRunners();
    const { takes } = useTakes();
    const { pss } = usePS();

    const score = ref([] as Score[]);

    effect(() => {
        if (selectedPS.value) {
            score.value = calculateScore(
                selectedPS.value,
                pss.value,
                takes.value,
                runners.value
            );
        } else {
            score.value = [];
        }
    });

    return {
        score,
    };
}
