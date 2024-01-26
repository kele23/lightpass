import { AbstractLevel } from 'abstract-level';
import { ShareLevel } from '@kele23/levelshare';
import { PS, Runner, Take, TakeType, Time } from '../interfaces/db.ts';
import mitt from 'mitt';

export const db = new ShareLevel({ location: './db' });
export const lightpassLevel = db.sublevel<string, any>(`lightpass`, { valueEncoding: 'json' });
export const timesLevel = lightpassLevel.sublevel<string, Time>(`times`, { valueEncoding: 'json' });

/////////////////////////////////////////////////////////////////////// EMITTER
//@ts-ignore
export const emitter = mitt();

const emit = () => {
    emitter.emit('db:change');
};

db.on('put', emit);
db.on('del', emit);
db.on('batch', emit);

const map = new Map<string, AbstractLevel<any, string, any>>();
/////////////////////////////////////////////////////////////////////// LEVELS
export function getRaceLevel(race: string) {
    if (!map.get(race)) map.set(race, lightpassLevel.sublevel<string, any>(race, { valueEncoding: 'json' }));
    return map.get(race)!;
}

export function getPsLevel(race: string): AbstractLevel<any, string, PS> {
    if (!map.get(race + 'ps'))
        map.set(race + 'ps', getRaceLevel(race).sublevel<string, PS>('ps', { valueEncoding: 'json' }));
    return map.get(race + 'ps')!;
}

export function getRunnersLevel(race: string): AbstractLevel<any, string, Runner> {
    if (!map.get(race + 'runners'))
        map.set(race + 'runners', getRaceLevel(race).sublevel<string, Runner>('runners', { valueEncoding: 'json' }));
    return map.get(race + 'runners')!;
}

export function getTakesLevel(race: string): AbstractLevel<any, string, Take> {
    if (!map.get(race + 'takes'))
        map.set(race + 'takes', getRaceLevel(race).sublevel<string, Take>('takes', { valueEncoding: 'json' }));
    return map.get(race + 'takes')!;
}

///////////////////////////////////////////////////////////////////// TIMING
export async function addTime(time: number) {
    const _id = time + '-' + Math.ceil(Math.random() * 1000);

    console.log('>>>>>>> New time ', new Date(time), time);
    // add new time
    await timesLevel.put(_id, { time });
    return {
        _id,
        time,
    } as Time;
}

export async function removeTime(_id: string) {
    await timesLevel.del(_id);
}

export async function addTake(raceId: string, timeId: string, psId: string, runnerId: string, type: TakeType) {
    // create take
    const takesLevel = getTakesLevel(raceId);
    const _id = cleanKey(psId + '-' + runnerId + '-' + type);
    const [found] = await takesLevel.getMany([_id]);
    if (found) {
        throw `Take ${_id} already exist`;
    }

    // remove old time
    const time = await timesLevel.get(timeId);

    const take = {
        time: time.time,
        ps: psId,
        runner: runnerId,
        type: type,
    };

    await timesLevel.del(timeId);
    await takesLevel.put(_id, take);
    return {
        _id,
        ...take,
    } as Take;
}

export async function removeTake(raceId: string, _id: string) {
    const takesLevel = getTakesLevel(raceId);
    const take = await takesLevel.get(_id);
    await addTime(take.time);
    await takesLevel.del(_id);
}

////////////////////////////////////////////////////// UTILS
export const cleanKey = (value: string) => {
    let result = value.replace(/\s+/, '-');
    result = result.toLowerCase();
    return result.replace(/[^a-z0-9-]/g, '');
};
