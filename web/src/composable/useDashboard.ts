import { Ref, computed } from 'vue';
import { FriendlyTake, Order, PS, Take, TakeType } from '../interfaces/db.ts';
import { Score } from '../interfaces/score.ts';
import { calculateScore } from '../utils/score.ts';
import { usePS } from './usePS.ts';
import { useRunners } from './useRunners.ts';
import { useTakes } from './useTakes.ts';
import { useTimes } from './useTimes.ts';

export function useDashboard(
  selectedPs: Ref<PS | undefined>,
  takeType: Ref<TakeType | undefined>,
  startOffset?: Ref<number>,
) {
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

  const retiredTakes = computed(() => {
    let tmpTakes: Take[] = allTakes.value.filter((item) => item.type == TakeType.retired);
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

  const psOrderedTmp = computed(() => {
    if (!selectedPs.value) return [];
    const tmp = calculateScore(selectedPs.value, pss.value, allTakes.value, runners.value);
    return [...tmp].sort((a, b) => {
      if (selectedPs.value!.order === Order.desc) {
        return b.number - a.number;
      }
      return a.number - b.number;
    });
  });

  const currentIndex = computed(() => {
    let lastWithTimeIndex = -1;
    for (let i = psOrderedTmp.value.length - 1; i >= 0; i--) {
      const hasTime = takeType.value === TakeType.start ? psOrderedTmp.value[i].hasStart : !!psOrderedTmp.value[i].end;
      if (hasTime || psOrderedTmp.value[i].retired) {
        lastWithTimeIndex = i;
        break;
      }
    }
    return lastWithTimeIndex + 1;
  });

  const hasMorePrevious = computed(() => {
    return currentIndex.value + (startOffset?.value ?? -5) > 0;
  });

  const score = computed(() => {
    if (selectedPs.value) {
      let limitedScore = [] as Score[];

      let minI = startOffset?.value ?? -5;
      if (currentIndex.value + minI < 0) {
        minI = -currentIndex.value;
      }

      for (let i = minI; i <= 5; i++) {
        const targetIndex = currentIndex.value + i;
        if (targetIndex < 0 || targetIndex >= psOrderedTmp.value.length) continue;

        const target = psOrderedTmp.value[targetIndex];
        let status: 'assigned' | 'missing' | 'waiting' | 'retired' = 'waiting';
        const hasTime = takeType.value === TakeType.start ? target.hasStart : !!target.end;

        if (target.retired) {
          status = 'retired';
        } else if (hasTime) {
          status = 'assigned';
        } else if (targetIndex < currentIndex.value) {
          status = 'missing';
        }

        limitedScore.push({
          ...target,
          status,
        });
      }

      return limitedScore.reverse();
    } else {
      return [];
    }
  });

  return {
    times,
    takes,
    retiredTakes,
    score,
    hasMorePrevious,
    addTake,
    updateTake,
    removeTake,
  };
}
