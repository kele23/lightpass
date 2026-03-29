import { Ref, computed } from 'vue';
import { FriendlyTake, PS, Take, TakeType } from '../interfaces/db.ts';
import { Score } from '../interfaces/score.ts';
import { calculateScore } from '../utils/score.ts';
import { usePS } from './usePS.ts';
import { useRunners } from './useRunners.ts';
import { useTakes } from './useTakes.ts';
import { useTimes } from './useTimes.ts';

export function useDashboard(selectedPs: Ref<PS | undefined>, takeType: Ref<TakeType | undefined>) {
  const { times } = useTimes();
  const { pss } = usePS();
  const { runners } = useRunners();
  const { takes: allTakes, addTake, updateTake, removeTake } = useTakes();

  const takes = computed(() => {
    let tmpTakes: Take[] = allTakes.value.filter((item) => item.type == takeType.value);
    if (selectedPs.value) tmpTakes = tmpTakes.filter((item) => item.ps == selectedPs.value?._id);

    return tmpTakes.map(
      (t) =>
        ({
          ...t,
          runnerNumber: runners.value.find((item) => item._id == t.runner)?.number,
          runnerName: runners.value.find((item) => item._id == t.runner)?.name,
          psName: pss.value.find((item) => item._id == t.ps)?.name,
        }) as FriendlyTake,
    );
  });

  const score = computed(() => {
    if (selectedPs.value) {
      let limitedScore = [] as Score[];
      const tmp = calculateScore(selectedPs.value, allTakes.value, runners.value);
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

      return limitedScore.reverse();
    } else {
      return [];
    }
  });

  return {
    times,
    takes,
    score,
    addTake,
    updateTake,
    removeTake,
  };
}
