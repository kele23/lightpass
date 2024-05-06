import { RACES_TYPES } from "../interfaces/db.ts";


///////////////////////////////////////////////////////////////////// TAKE
// export async function addTake(
//     raceId: string,
//     timeId: string,
//     psId: string,
//     runnerId: string,
//     type: TakeType
// ): Promise<Take> {
//     const race = getRaceDB(raceId);
//     const _id = createKey('take!', psId + '-' + runnerId + '-' + type);
//     const found = await race.get(_id);
//     if (found) {
//         throw `Take ${_id} already exist`;
//     }

//     // get time
//     const time = await timesDB.get(timeId);
//     const take: Take = {
//         _id: _id,
//         time: time.time,
//         ps: psId,
//         runner: runnerId,
//         type: type,
//     };

//     const resp = await race.put(take);
//     return { ...take, _rev: resp.rev } as Take;
// }

// export async function removeTake(raceId: string, _id: string) {
//     const race = getRaceDB(raceId);
//     const take = await race.get<Take>(_id);
//     await addTime(take.time);
//     await race.remove(take);
// }

////////////////////////////////////////////////////// UTILS
export const createKey = (type: string, value: string) => {
    return `${cleanKey(type)}!${cleanKey(value)}`;
};

export const cleanKey = (value: string) => {
    let result = value.replace(/\s+/g, '-');
    result = result.toLowerCase();
    return result.replace(/[^a-z0-9-]/g, '');
};

export const getFiltersForType = (type: RACES_TYPES) => {
    return { startkey: `${type}!`, endkey: `${type}!\ufff0` };
};
