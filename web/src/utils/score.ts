import { Order, PS, Runner, Take, TakeType } from '../interfaces/db.ts';
import { GlobalScore, Score } from '../interfaces/score.ts';
//import { getPsLevel, getRunnersLevel, getTakesLevel } from '../services/utils.ts';

export function calculateScore(ps: PS, pss: PS[], allTakes: Take[], runners: Runner[]): Score[] {
  const takes = allTakes.filter((item) => item.ps == ps!._id);
  const startTakesMap = new Map();
  const endTakesMap = new Map();
  for (const take of takes) {
    if (take.type == TakeType.start) {
      startTakesMap.set(take.runner, take);
    } else if (take.type == TakeType.end) {
      endTakesMap.set(take.runner, take);
    }
  }

  const takesMap = new Map();
  for (const runnerId of runners.map((r) => r._id)) {
    takesMap.set(runnerId, { start: startTakesMap.get(runnerId), end: endTakesMap.get(runnerId) });
  }

  const sortedPSs = [...pss].toSorted((a, b) => a.start - b.start);
  const psIndex = sortedPSs.findIndex((p) => p._id === ps._id);
  const relevantPSIds = sortedPSs.slice(0, psIndex + 1).map((p) => p._id);

  const retiredRunners = new Set<string>();
  for (const take of allTakes) {
    if (take.type == TakeType.retired && relevantPSIds.includes(take.ps)) {
      retiredRunners.add(take.runner);
    }
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
    const customStart = ps.customStarts?.find((p) => p.runner == runner.number);

    if (customStart) {
      currentStart = customStart.time;
    } else if (lastRunner) {
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
      pen: (start.pen || 0) + (end?.pen || 0),
      number: runner.number,
      name: runner.name,
      category: runner.category,
      team: runner.team,
      fci: runner.fci,
      uci: runner.uci,
      naz: runner.naz,
      ps: ps.name,
      pos: undefined,
      hasStart: !!take?.start,
      retired: retiredRunners.has(runner._id),
    });

    lastRunner = runner;
  }

  // sort and write pos
  const tmpSorted = tmp.toSorted(scoreSorter);
  let pos = 1;
  for (let i = 0; i < tmpSorted.length; i++) {
    if (tmpSorted[i].retired) {
      tmpSorted[i].diff = undefined;
      tmpSorted[i].pos = undefined;
    } else {
      tmpSorted[i].pos = tmpSorted[i].diff != null ? pos++ : undefined;
    }
  }

  return tmpSorted;
}

export function calculateGlobalScore(pss: PS[], allTakes: Take[], runners: Runner[]): GlobalScore[] {
  const resultMap = new Map<number, GlobalScore>();

  for (const ps of pss) {
    const score = calculateScore(ps, pss, allTakes, runners);

    for (const item of score) {
      if (!resultMap.has(item.number)) {
        resultMap.set(item.number, {
          _id: `${item.number}`,
          number: item.number,
          name: item.name,
          category: item.category,
          team: item.team,
          fci: item.fci,
          uci: item.uci,
          naz: item.naz,
          diff: item.diff,
          pen: item.pen,
        });
      } else {
        const currentResult = resultMap.get(item.number)!;
        currentResult.pen = (currentResult.pen || 0) + (item.pen || 0);
        if (item.diff == null || currentResult.diff == null) {
          currentResult.diff = undefined;
        } else {
          currentResult.diff = item.diff + currentResult.diff;
        }
      }
    }
  }

  // sort and write pos
  const tmpSorted = Array.from(resultMap.values()).sort(scoreSorter);
  for (let i = 0; i < tmpSorted.length; i++) {
    tmpSorted[i].pos = tmpSorted[i].diff != null ? i + 1 : undefined;
  }

  return tmpSorted;
}

export function scoreSorter(a: Score | GlobalScore, b: Score | GlobalScore) {
  if (a.diff == b.diff) return 0;
  if (a.diff == null || a.diff == undefined) return 1;
  if (b.diff == null || b.diff == undefined) return -1;
  return a.diff - b.diff;
}
