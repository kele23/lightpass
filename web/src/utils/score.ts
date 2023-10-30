import { Order, PS, Race, Runner, Take, TakeType } from '../interfaces/db';
import { GlobalScore, Score } from '../interfaces/score';
import { getPsLevel, getRunnersLevel, getTakesLevel } from '../services/db';

export async function calculateScore(ps: PS, currentRace: Race): Promise<Score[]> {
    const takesLevel = getTakesLevel(currentRace._id!);
    const runnersLevel = getRunnersLevel(currentRace._id!);

    const takes = new Map();
    const iterator = takesLevel.iterator({ gte: ps._id, lt: ps._id + '~' });
    let start = undefined as Take | undefined;
    for await (const [_id, value] of iterator) {
        if (value.type == TakeType.start) {
            start = { _id, ...value };
            continue;
        }

        const end = { _id, ...value } as Take;
        if (start?.runner != end.runner) {
            start = undefined;
        }

        takes.set(end.runner, { start, end });
    }

    let tmp = [] as Score[];

    const reverse = ps.order == Order.desc;
    let currentStart = ps.start;
    let lastRunner = undefined;
    for await (const [_id, value] of runnersLevel.iterator({ reverse })) {
        const runner = { _id, ...value } as Runner;
        if (lastRunner) {
            currentStart = currentStart + ps.gap * 1000 * Math.abs(runner.number - lastRunner.number);
        }

        const take = takes.get(runner._id);
        let start = take?.start;
        let end = take?.end;
        if (!start) {
            start = { time: currentStart };
        }

        tmp.push({
            start: start.time,
            end: end?.time,
            diff: end ? end.time - start.time : undefined,
            number: runner.number,
            name: runner.name,
            category: runner.category,
            team: runner.team,
            ps: ps.name,
        });

        lastRunner = runner;
    }

    return tmp;
}

export async function calculateGlobalScore(race: Race): Promise<GlobalScore[]> {
    // get all ps
    const psLevel = getPsLevel(race._id!);
    let pss = [] as PS[];
    try {
        const iterator = psLevel.iterator();
        for await (const [key, value] of iterator) {
            const ps = {
                _id: key,
                ...value,
            } as PS;
            pss.push(ps);
        }
    } catch (err) {
        console.error(err);
    }

    const result = [] as GlobalScore[];
    for (const ps of pss) {
        const score = await calculateScore(ps, race);

        for (let i = 0; i < score.length; i++) {
            const item = score[i];

            if (i + 1 > result.length) {
                result.push({
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

    return result;
}

export function scoreSorter(a: Score | GlobalScore, b: Score | GlobalScore) {
    if (a.diff == b.diff) return 0;
    if (a.diff == null || a.diff == undefined) return 1;
    if (b.diff == null || b.diff == undefined) return -1;
    return a.diff - b.diff;
}
