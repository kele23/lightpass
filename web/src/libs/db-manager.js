import Dexie from 'dexie';

class DBManager {
    constructor() {
        this.db = new Dexie('Lightpass');

        // Declare tables, IDs and indexes
        this.db.version(6).stores({
            race: '++id, name',
            runner: '++id, name, number, category, team, fci, uci, soc, naz, race',
            ps: '++id, name, start, gap, order, race',
            time: '++id, time, race',
            take: '++id, time, ps, runner, race, pen',
        });
    }

    ///// RACE
    async createRace(name) {
        return await this.db.race.add({ name });
    }

    async getAllRace() {
        return await this.db.race.toArray();
    }

    ///// PS
    async getAllPS(race) {
        return await this.db.ps.where('race').equals(parseInt(race)).toArray();
    }

    async createOrUpdatePS({ name, gap, order, start, race, id }) {
        if (id) {
            return await this.db.ps.update(parseInt(id), {
                name,
                gap,
                start: parseInt(start),
                order,
                race: parseInt(race),
            });
        } else {
            return await this.db.ps.add({ name, gap, start: parseInt(start), order, race: parseInt(race) });
        }
    }

    async deletePS({ id }) {
        return await this.db.ps.delete(parseInt(id));
    }

    async cleanPS({ race }) {
        const array = await this.db.ps.where('race').equals(parseInt(race)).toArray();
        const ids = array.map((item) => {
            return item.id;
        });
        await this.db.ps.bulkDelete(ids);
    }

    async getPS(id) {
        return await this.db.ps.get(parseInt(id));
    }

    async getPSBy({ name, race }) {
        return await this.db.ps.get({ name, race: parseInt(race) });
    }

    ////////////////////////////////////////////////////////////////////////////////// Runners
    async getRunnerBy({ number, race }) {
        return await this.db.runner.get({ number: parseInt(number), race: parseInt(race) });
    }

    async getAllRunner(race) {
        return await this.db.runner.where('race').equals(parseInt(race)).toArray();
    }

    async createOrUpdateRunner({ name, number, category, race, team, id, naz, uci, fci, soc }) {
        if (id) {
            return await this.db.runner.update(parseInt(id), {
                name,
                number: parseInt(number),
                category,
                race: parseInt(race),
                team,
                naz,
                uci,
                fci,
                soc,
            });
        } else {
            return await this.db.runner.add({
                name,
                number: parseInt(number),
                category,
                race: parseInt(race),
                team,
                naz,
                uci,
                fci,
                soc,
            });
        }
    }

    async deleteRunner({ id }) {
        return await this.db.runner.delete(parseInt(id));
    }

    async cleanRunner({ race }) {
        const array = await this.db.runner.where('race').equals(parseInt(race)).toArray();
        const ids = array.map((item) => {
            return item.id;
        });
        await this.db.runner.bulkDelete(ids);
    }

    ////////////////////////////////////////////////////////////////////////////////// time
    async getTime(id) {
        return await this.db.time.get(parseInt(id));
    }

    async getAllTime(race) {
        return await this.db.time.where('race').equals(parseInt(race)).toArray();
    }

    async addTime({ time, race }) {
        return await this.db.time.add({ time, race: parseInt(race) });
    }

    async deleteTime({ id }) {
        return await this.db.time.delete(parseInt(id));
    }

    ////////////////////////////////////////////////////////////////////////////////// take
    async getTake(id) {
        return await this.db.take.get(parseInt(id));
    }

    async getTakeBy({ ps, runner, race }) {
        return await this.db.take.get({ ps: parseInt(ps), runner: parseInt(runner), race: parseInt(race) });
    }

    async getAllTake(race, ps) {
        if (!ps || ps == 'all') return await this.db.take.where('race').equals(parseInt(race)).toArray();
        return await this.db.take.where({ race: parseInt(race), ps: parseInt(ps) }).toArray();
    }

    async createTake({ time, ps, runner, race, pen = 0 }) {
        return await this.db.take.add({
            time: parseInt(time),
            ps: parseInt(ps),
            runner: parseInt(runner),
            race: parseInt(race),
            pen: pen,
        });
    }

    async deleteTake({ id }) {
        return await this.db.take.delete(parseInt(id));
    }

    async cleanTake({ race }) {
        const array = await this.db.take.where('race').equals(parseInt(race)).toArray();
        const ids = array.map((item) => {
            return item.id;
        });
        await this.db.take.bulkDelete(ids);
    }

    async cleanTakeByPs({ race, ps }) {
        const array = await this.db.take.where({ race: parseInt(race), ps: parseInt(ps) }).toArray();
        const ids = array.map((item) => {
            return item.id;
        });
        await this.db.take.bulkDelete(ids);
    }

    async setPenalty(id, penalty) {
        return await this.db.take.update(parseInt(id), { pen: parseInt(penalty) });
    }

    ////////////////////////////////////////////////////////////////////////////////// special
    async getTimeJoin(id) {
        const time = await this.db.time.get(parseInt(id));
        const found = await this.db.take.where('time').equals(time.id).toArray();
        if (!found || found.length == 0) return { ...time };
        const runner = await this.db.runner.get(found[0].runner);
        if (!runner) return { ...time };
        return { ...time, assigned: runner.number, assignedName: runner.name };
    }

    async getAllTimeJoin(race, onlyNotAssigned = false) {
        let times = await this.getAllTime(race);
        let result = await Promise.all(
            times.map(async (time) => {
                const found = await this.db.take.where('time').equals(time.id).toArray();
                if (!found || found.length == 0) return time;
                const runner = await this.db.runner.get(found[0].runner);
                const ps = await this.db.ps.get(found[0].ps);
                if (!runner || !ps) return { ...time };
                return { ...time, assigned: runner.number, assignedName: runner.name, assignedPs: ps.name };
            })
        );

        if (onlyNotAssigned) {
            result = result.filter((item) => !item.assigned);
        }

        return result;
    }

    async getAllTakeJoinWithoutScore(race, psId) {
        const takes = await this.getAllTake(race, psId);
        const result = await Promise.all(
            takes.map(async (take) => {
                const time = await this.db.time.get(take.time);
                const runner = await this.db.runner.get(take.runner);
                const ps = await this.db.ps.get(take.ps);
                if (!runner || !ps || !time) return { ...take };
                return {
                    ...take,
                    assignedIdTime: time.id,
                    assignedTime: time.time,
                    assigned: runner.number,
                    assignedName: runner.name,
                    assignedPs: ps.name,
                    status: 'ok',
                };
            })
        );

        return result;
    }

    async getAllTakeJoinWithScore(race, psId) {
        let score = await this.getScoreFull(psId, race);

        score = score.reverse();

        let result = [];
        let firstTakeIndex = score.length;
        for (let i = 0; i < score.length; i++) {
            const { runner, time, take, ps, start, diff } = { ...score[i] };

            let status = 'next';
            if (take?.time) status = 'ok';
            else if (i > firstTakeIndex) status = 'missing';

            result.push({
                ...take,
                assignedIdTime: time?.id,
                assignedTime: time?.time,
                assigned: runner.number,
                assignedName: runner.name,
                assignedPs: ps.name,
                start,
                diff,
                status,
            });

            if (take?.time && firstTakeIndex > i) {
                firstTakeIndex = i;
            }
        }

        return result.slice(Math.max(0, firstTakeIndex - 3));
    }

    async getAllCategories(race) {
        const runners = await this.getAllRunner(race);
        const categories = runners.map((item) => item.category);
        return [...new Set(categories)];
    }

    async getAllTeams(race) {
        const runners = await this.getAllRunner(race);
        const teams = runners.map((item) => item.team);
        return [...new Set(teams)];
    }

    async getScoreFull(psId, race) {
        const ps = await this.db.ps.get(parseInt(psId));
        if (!ps) return [];

        let runners = await this.db.runner.where({ race: parseInt(race) }).toArray();
        if (!runners) return [];

        const takes = await this.getAllTake(race, psId);
        const takesObj = {};
        for (const take of takes) {
            takesObj[take.runner] = take;
        }

        // sort runners by ps direction for start calc
        runners = runners.sort((one, two) => {
            const a = ps.order == 'asc' ? one : two;
            const b = ps.order == 'asc' ? two : one;

            if (a.number == b.number) {
                return 0;
            }

            if (a.number < b.number) {
                return -1;
            }
            if (a.number > b.number) {
                return 1;
            }
        });

        //iterate and create final object
        let start = new Date(ps.start);
        const gap = parseInt(ps.gap);
        const tmpResult = [];
        for (let i = 0; i < runners.length; i++) {
            const runner = runners[i];

            // get diff
            let diff = null;
            let end = null;
            let take = takesObj[runner.id];
            let time = null;
            if (take) {
                time = await this.getTime(take.time);
                end = new Date(time.time);
                diff = end.getTime() - start.getTime();
                if (take.pen) {
                    diff += take.pen * 1000;
                }
            }
            tmpResult.push({ runner, ps, take, time, start, diff });

            // next start
            const nextRunner = i + 1 >= runners.length ? null : runners[i + 1];
            const mult = !nextRunner ? 1 : Math.abs(nextRunner.number - runner.number);
            start = new Date(start.getTime() + gap * 1000 * mult);
        }

        return tmpResult;
    }

    async getScore(psId, race, categories, teams) {
        const scoreFull = await this.getScoreFull(psId, race);

        // order and map
        let tmpResult = scoreFull
            .sort((a, b) => {
                if (a.diff == b.diff) return 0;
                if (a.diff == null || a.diff == undefined) return 1;
                if (b.diff == null || b.diff == undefined) return -1;
                return a.diff - b.diff;
            })
            .map(({ runner, ps, take, time, start, diff }) => ({
                ...runner,
                ps: ps.name,
                start: start.getTime(),
                end: time?.time,
                pen: take?.pen,
                diff,
            }));

        //filter category
        if (categories && categories.length > 0) {
            tmpResult = tmpResult.filter((item) => categories.indexOf(item.category) >= 0);
        }

        // filter team
        if (teams && teams.length > 0) {
            tmpResult = tmpResult.filter((item) => teams.indexOf(item.team) >= 0);
        }

        // set position
        let results = [];
        for (let i = 0; i < tmpResult.length; i++) {
            results.push({
                pos: i + 1,
                ...tmpResult[i],
            });
        }

        return results;
    }

    async getGlobalScore(race, categories, teams) {
        let runners = await this.getAllRunner(race);
        if (!runners) return [];

        //filter category
        if (categories && categories.length > 0) {
            runners = runners.filter((item) => categories.indexOf(item.category) >= 0);
        }

        // filter team
        if (teams && teams.length > 0) {
            runners = runners.filter((item) => teams.indexOf(item.team) >= 0);
        }

        // get score for each ps
        const pss = await this.getAllPS(race);
        const map = new Map();
        for (const ps of pss) {
            const psResults = await this.getScoreFull(ps.id, race);
            for (const result of psResults) {
                if (!result.diff) continue;
                let psRunnerRes = map.get(result.runner.number);
                if (!psRunnerRes) psRunnerRes = [];
                psRunnerRes.push(result.diff);
                map.set(result.runner.number, psRunnerRes);
            }
        }

        // calcolate diff, only for selected runners
        let tmpResult = [];
        for (const runner of runners) {
            const values = map.get(runner.number);

            let diff = null;
            if (values && values.length == pss.length) {
                diff = 0;
                for (const val of values) {
                    diff += val;
                }
            }

            tmpResult.push({
                ...runner,
                diff,
            });
        }

        // order
        tmpResult = tmpResult.sort((a, b) => {
            if (a.diff == b.diff) return 0;
            if (a.diff == null || a.diff == undefined) return 1;
            if (b.diff == null || b.diff == undefined) return -1;
            return a.diff - b.diff;
        });

        // make results and set position
        let results = [];
        for (let i = 0; i < tmpResult.length; i++) {
            results.push({
                pos: i + 1,
                ...tmpResult[i],
            });
        }

        return results;
    }

    ///////////// GLOBAL
    async clear() {
        this.db.tables.forEach(function (table) {
            table.clear();
        });
    }
}

/**
 * @returns {DynamicRegister} the register
 */
export const getDBManager = () => {
    if (!window.rcDbManager) {
        window.rcDbManager = new DBManager();
    }
    return window.rcDbManager;
};
