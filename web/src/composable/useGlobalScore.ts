import { ref, watch } from 'vue';
import { GlobalScore } from '../interfaces/score';
import { calculateGlobalScore, scoreSorter } from '../utils/score';
import { useRace } from './useRace';

export function useGlobalScore() {
    const { currentRace } = useRace();
    const globalScore = ref<GlobalScore[]>([]);
    const reset = ref(0);

    watch(currentRace, () => {
        reset.value++;
    });

    watch(reset, async () => {
        if (!currentRace || !currentRace.value) return;
        const tmp = await calculateGlobalScore(currentRace.value);

        // order
        globalScore.value = tmp.sort(scoreSorter);
    });

    return {
        globalScore,
    };
}
