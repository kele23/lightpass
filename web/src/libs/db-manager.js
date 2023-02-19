import Dexie from 'dexie';

class DBManager {
    constructor() {
        this.db = new Dexie('Lightpass');

        // Declare tables, IDs and indexes
        this.db.version(5).stores({
            race: '++id, name',
            runner: '++id, name, number, category, race',
            ps: '++id, name, start, gap, order, race',
            time: '++id, time, race',
            take: '++id, &time, ps, runner, race',
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

    async createOrUpdateRunner({ name, number, category, race, id }) {
        if (id) {
            return await this.db.runner.update(parseInt(id), {
                name,
                number: parseInt(number),
                category,
                race: parseInt(race),
            });
        } else {
            return await this.db.runner.add({ name, number: parseInt(number), category, race: parseInt(race) });
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
    async getTakeBy({ ps, runner, race }) {
        return await this.db.take.get({ ps: parseInt(ps), runner: parseInt(runner), race: parseInt(race) });
    }

    async getAllTake(race, ps) {
        if (!ps || ps == 'all') return await this.db.take.where('race').equals(parseInt(race)).toArray();
        return await this.db.take.where({ race: parseInt(race), ps: parseInt(ps) }).toArray();
    }

    async createTake({ time, ps, runner, race }) {
        return await this.db.take.add({
            time: parseInt(time),
            ps: parseInt(ps),
            runner: parseInt(runner),
            race: parseInt(race),
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

    async getAllTakeJoin(race, ps) {
        const takes = await this.getAllTake(race, ps);
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
                };
            })
        );

        return result;
    }

    async getScore(psId, race) {
        const ps = await this.db.ps.get(parseInt(psId));
        if (!ps) return [];
        let runners = await this.db.runner.where('race').equals(parseInt(race)).toArray();
        if (!runners) return [];

        // sort runners by ps direction
        runners = runners.sort((one, two) => {
            const a = ps.direction == 'asc' ? one : two;
            const b = ps.direction == 'asc' ? two : one;

            if (a.number === undefined) {
                return 1;
            }
            if (b.number === undefined) {
                return -1;
            }

            if (a.number < b.number) {
                return -1;
            }
            if (a.number >= b.number) {
                return 1;
            }
        });

        //iterate and create final object
        let start = new Date(ps.start);
        const gap = parseInt(ps.gap);
        const result = [];
        for (const runner of runners) {
            // get diff
            let diff = null;
            let end = null;
            const take = await this.getTakeBy({ ps: ps.id, runner: runner.id, race: race });
            if (take) {
                const time = await this.getTime(take.time);
                end = new Date(time.time);
                diff = new Date(end.getTime() - start.getTime());
                console.log(diff);
            }
            result.push({ ...runner, ps: ps.name, start: start.getTime(), end: end?.getTime(), diff: diff?.getTime() });

            // next start
            start = new Date(start.getTime() + gap * 1000);
        }

        return result;
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
