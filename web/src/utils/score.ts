import { Order, PS, Runner, Take, TakeType } from '../interfaces/db.ts';
import { GlobalScore, Score } from '../interfaces/score.ts';
//import { getPsLevel, getRunnersLevel, getTakesLevel } from '../services/utils.ts';

export function calculateScore(ps: PS, allTakes: Take[], runners: Runner[]): Score[] {
  const takes = allTakes.filter((item) => item.ps == ps!._id);
  const startTakesMap = new Map();
  const endTakesMap = new Map();
  for (const take of takes) {
    if (take.type == TakeType.start) {
      startTakesMap.set(take.runner, take);
    } else {
      endTakesMap.set(take.runner, take);
    }
  }

  const takesMap = new Map();
  for (const runnerId of runners.map((r) => r._id)) {
    takesMap.set(runnerId, { start: startTakesMap.get(runnerId), end: endTakesMap.get(runnerId) });
  }

  let tmp = [] as Score[];

  // order runners
  const orderedRunners = runners.toSorted((a, b) => a.number - b.number);

  // iterate runners in ps order
  const reverse = ps.order == Order.desc;
  const itRunners = reverse ? orderedRunners.reverse() : orderedRunners;

  let currentStart = ps.start;
  let lastRunner: Runner | undefined = undefined;
  for (const runner of itRunners) {
    if (lastRunner) {
      currentStart = currentStart + ps.gap * 1000 * Math.abs(runner.number - lastRunner.number);
    }

    const take = takesMap.get(runner._id);
    let start = take?.start;
    let end = take?.end;
    if (!start) {
      start = { time: currentStart };
    }

    tmp.push({
      _id: `${start.time}-${runner._id}`,
      start: start.time,
      end: end?.time,
      diff: end ? end.time - start.time + (start.pen || 0) + (end.pen || 0) : undefined,
      number: runner.number,
      name: runner.name,
      category: runner.category,
      team: runner.team,
      ps: ps.name,
      pos: undefined,
    });

    lastRunner = runner;
  }

  // sort and write pos
  const tmpSorted = tmp.toSorted(scoreSorter);
  for (let i = 0; i < tmpSorted.length; i++) {
    tmpSorted[i].pos = tmpSorted[i].diff ? i + 1 : undefined;
  }

  return tmpSorted;
}

export function calculateGlobalScore(pss: PS[], allTakes: Take[], runners: Runner[]): GlobalScore[] {
  const result = [] as GlobalScore[];
  for (const ps of pss) {
    const score = calculateScore(ps, allTakes, runners);

    for (let i = 0; i < score.length; i++) {
      const item = score[i];

      if (i + 1 > result.length) {
        result.push({
          _id: `${item.number}`,
          number: item.number,
          name: item.name,
          category: item.category,
          team: item.team,
          diff: item.diff,
        });
      } else {
        const currentResult = result[i];
        if (!item.diff || !currentResult.diff) {
          currentResult.diff = undefined;
        } else {
          currentResult.diff = item.diff + currentResult.diff;
        }
      }
    }
  }

  // sort and write pos
  const tmpSorted = [...result].sort(scoreSorter);
  for (let i = 0; i < tmpSorted.length; i++) {
    tmpSorted[i].pos = tmpSorted[i].diff ? i + 1 : undefined;
  }

  return result;
}

export function scoreSorter(a: Score | GlobalScore, b: Score | GlobalScore) {
  if (a.diff == b.diff) return 0;
  if (a.diff == null || a.diff == undefined) return 1;
  if (b.diff == null || b.diff == undefined) return -1;
  return a.diff - b.diff;
}
