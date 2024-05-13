import { effect, ref } from 'vue';
import { GlobalScore } from '../interfaces/score.ts';
import { calculateGlobalScore } from '../utils/score.ts';
import { usePS } from './usePS.ts';
import { useRunners } from './useRunners.ts';
import { useTakes } from './useTakes.ts';

export function useGlobalScore() {
    const { pss } = usePS();
    const { runners } = useRunners();
    const { takes } = useTakes();

    const score = ref([] as GlobalScore[]);

    effect(() => {
        score.value = calculateGlobalScore(pss.value, takes.value, runners.value);
    });

    return {
        score,
    };
}
