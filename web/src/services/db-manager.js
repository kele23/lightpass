import PouchDB from 'pouchdb';
import PouchDbAutentication from 'pouchdb-authentication';
import PouchDbFind from 'pouchdb-find';
PouchDB.plugin(PouchDbAutentication);
PouchDB.plugin(PouchDbFind);

class DBManager {
    constructor() {
        this.db = new PouchDB('lightpass');
        this.remoteDB = new PouchDB('http://localk:5984/lightpass', {
            skip_setup: true,
        });

        // sync
        this.remoteDB.login('admin', 'password').then(() => {
            this.db.sync(this.remoteDB, {
                live: true,
                retry: true,
            });
        });
    }

    /**
     * Initialize DB
     */
    async initialize() {
        // standard get index
        this.db.createIndex({
            index: { fields: ['type', 'race'] },
        });
        // take index
        this.db.createIndex({
            index: { fields: ['time', 'race', 'runner', 'ps'] },
            partial_filter_selector: {
                type: 'take',
            },
        });
    }

    async get(_id) {
        try {
            return await this.db.get(_id);
        } catch (e) {
            if (e.status == 404) return null;
            throw e;
        }
    }

    async remove(_id) {
        try {
            const doc = await this.db.get(_id);
            await this.db.remove(doc);
        } catch (e) {
            if (e.status == 404) return null;
            throw e;
        }
    }

    ////////////////////////////////////////////////////////////////// RACE
    async createRace(name) {
        var doc = {
            _id: this._makeId('race', name),
            type: 'race',
            name: name,
            createdAt: new Date().toISOString(),
        };
        return await this.db.put(doc);
    }

    async getAllRace() {
        return (
            await this.db.find({
                selector: {
                    type: 'race',
                },
            })
        ).docs;
    }

    async getRace(_id) {
        return await this.get(_id);
    }

    ////////////////////////////////////////////////////////////////// PS
    async getAllPSs(race) {
        return (
            await this.db.find({
                selector: {
                    type: 'ps',
                    race,
                },
            })
        ).docs;
    }

    async createPS({ name, gap, order, start, race }) {
        var doc = {
            _id: this._makeId('ps', name, race),
            type: 'ps',
            name,
            gap,
            order,
            start,
            race,
            createdAt: new Date().toISOString(),
        };

        return await this.db.put(doc);
    }

    async deletePS(_id) {
        return await this.remove(_id);
    }

    async cleanPSs(race) {
        const docs = (await this.getAllPSs(race)).map((item) => ({ _id: item._id, _rev: item._rev, _deleted: true }));
        await this.db.bulkDocs(docs);
    }

    async getPS(_id) {
        return await this.get(_id);
    }

    async getPSBy({ name, race }) {
        return await this.get(this._makeId('ps', name, race));
    }

    //   ////////////////////////////////////////////////////////////////////////////////// Runners

    async getRunner(_id) {
        return await this.get(_id);
    }

    async getRunnerBy({ number, race }) {
        return await this.get(this._makeId('runner', number, race));
    }

    async getAllRunners(race) {
        return (
            await this.db.find({
                selector: {
                    type: 'runner',
                    race,
                },
            })
        ).docs;
    }

    async createRunner({ name, number, category, race, team, naz, uci, fci, soc }) {
        var doc = {
            _id: this._makeId('runner', number, race),
            type: 'runner',
            name,
            number,
            category,
            team,
            naz,
            uci,
            fci,
            soc,
            race,
            createdAt: new Date().toISOString(),
        };

        return await this.db.put(doc);
    }

    async deleteRunner(_id) {
        return await this.remove(_id);
    }

    async cleanRunners(race) {
        const docs = (await this.getAllRunners(race)).map((item) => ({
            _id: item._id,
            _rev: item._rev,
            _deleted: true,
        }));
        await this.db.bulkDocs(docs);
    }

    ////////////////////////////////////////////////////////////////////////////////// time
    async getTime(_id) {
        return await this.get(_id);
    }

    async getAllTimes(race) {
        return (
            await this.db.find({
                selector: {
                    type: 'time',
                    race,
                },
            })
        ).docs;
    }

    async addTime({ time, race }) {
        var doc = {
            _id: this._makeId('time', time, race),
            type: 'time',
            time,
            race,
            createdAt: new Date().toISOString(),
        };

        return await this.db.put(doc);
    }

    async deleteTime(_id) {
        return await this.remove(_id);
    }

    ////////////////////////////////////////////////////////////////////////////////// take
    async getTake(_id) {
        return await this.get(_id);
    }

    async getTakeBy({ ps, runner, race }) {
        const _id = this._makeTakeId(ps, runner, race);
        return await this.get(_id);
    }

    async getAllTakes(race) {
        return (
            await this.db.find({
                selector: {
                    type: 'take',
                    race,
                },
            })
        ).docs;
    }

    async getAllTakesByPs(ps, race) {
        return (
            await this.db.find({
                selector: {
                    type: 'take',
                    race,
                    ps,
                },
            })
        ).docs;
    }

    async createTake({ time, ps, runner, race }) {
        const _id = this._makeTakeId(ps, runner, race);
        var doc = {
            _id,
            type: 'take',
            time,
            ps,
            race,
            runner,
            createdAt: new Date().toISOString(),
        };

        return await this.db.put(doc);
    }

    async deleteTake(_id) {
        return await this.remove(_id);
    }

    async cleanTakes(race) {
        const docs = (await this.getAllTakes(race)).map((item) => ({
            _id: item._id,
            _rev: item._rev,
            _deleted: true,
        }));
        await this.db.bulkDocs(docs);
    }

    //   async cleanTakeByPs({ race, ps }) {
    //     const array = await this.db.take
    //       .where({ race: parseInt(race), ps: parseInt(ps) })
    //       .toArray();
    //     const ids = array.map((item) => {
    //       return item.id;
    //     });
    //     await this.db.take.bulkremove(ids);
    //   }

    //   async cleanTakeByRunner({ race, runner }) {
    //     const array = await this.db.take
    //       .where({ race: parseInt(race), runner: parseInt(runner) })
    //       .toArray();
    //     const ids = array.map((item) => {
    //       return item.id;
    //     });
    //     await this.db.take.bulkremove(ids);
    //   }

    //   async setPenalty(id, penalty) {
    //     return await this.db.take.update(parseInt(id), { pen: parseInt(penalty) });
    //   }

    ////////////////////////////////////////////////////////////////////////////////// special
    async getAllNonAssignedTimes(race) {
        const times = await this.getAllTimes(race);
        const takesTimes = await (await this.getAllTakes(race)).map((item) => item.time);

        const result = [];
        for (const time of times) {
            if (takesTimes.indexOf(time._id) < 0) result.push(time);
        }
        return result;
    }

    async getTimeJoin(_id) {
        const time = await this.get(_id);
        if (!time) return null;

        const take = await this.db.find({
            selector: {
                type: 'take',
                time: _id,
            },
        });
        if (!take) return time;
        const runner = await this.db.get(take.runner);
        return { ...time, assigned: runner.number, assignedName: runner.name };
    }

    async getAllTimesJoin(race) {
        let times = await this.getAllTimes(race);
        let takes = await this.getAllTakes(race);

        let takesMap = {};
        for (const take of takes) {
            takesMap[take.time] = take;
        }

        let results = [];
        for (const time of times) {
            const take = takesMap[time._id];
            if (!take) {
                results.push(time);
                continue;
            }

            const runner = await this.get(take.runner);
            const ps = await this.get(take.ps);

            results.push({
                ...time,
                assigned: runner.number,
                assignedName: runner.name,
                assignedPs: ps.name,
            });
        }

        return results;
    }

    async getAllTakesJoin(race, ps) {
        const takes = ps ? await this.getAllTakesByPs(ps, race) : await this.getAllTakes(race);

        let results = [];
        for (const take of takes) {
            const time = await this.get(take.time);
            const runner = await this.get(take.runner);
            const ps = await this.get(take.ps);

            results.push({
                ...take,
                assigned: runner.number,
                assignedName: runner.name,
                assignedPs: ps.name,
                assignedTime: time.time,
                status: 'ok',
            });
        }

        return results;
    }

    async getAllTakesJoinWithScore(race, ps) {
        let score = await this.getScoreFull(ps, race);

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

        return result.slice(Math.max(0, firstTakeIndex - 5));
    }

    async getAllCategories(race) {
        const runners = await this.getAllRunners(race);
        const categories = runners.map((item) => item.category);
        return [...new Set(categories)];
    }

    async getAllTeams(race) {
        const runners = await this.getAllRunners(race);
        const teams = runners.map((item) => item.team);
        return [...new Set(teams)];
    }

    async getScoreFull(psId, race) {
        const ps = await this.get(psId);
        if (!ps) return [];

        let runners = await this.getAllRunners(race);
        if (!runners) return [];

        const takes = await this.getAllTakesByPs(psId, race);
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
        let start = ps.start;
        const gap = parseInt(ps.gap);
        const tmpResult = [];
        for (let i = 0; i < runners.length; i++) {
            const runner = runners[i];

            // get diff
            let diff = null;
            let end = null;
            let take = takesObj[runner._id];
            let time = null;
            if (take) {
                time = await this.getTime(take.time);
                end = time.time;
                diff = end - start;
                if (take.pen) {
                    diff += take.pen * 1000;
                }
            }
            tmpResult.push({ runner, ps, take, time, start, diff });

            // next start
            const nextRunner = i + 1 >= runners.length ? null : runners[i + 1];
            const mult = !nextRunner ? 1 : Math.abs(nextRunner.number - runner.number);
            start = start + gap * 1000 * mult;
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
                start: start,
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

    //   async getGlobalScore(race, categories, teams) {
    //     let runners = await this.getAllRunner(race);
    //     if (!runners) return [];

    //     // sort runners by number for uniformity
    //     runners = runners.sort((a, b) => {
    //       if (a.number == b.number) {
    //         return 0;
    //       }

    //       if (a.number < b.number) {
    //         return -1;
    //       }
    //       if (a.number > b.number) {
    //         return 1;
    //       }
    //     });

    //     //filter category
    //     if (categories && categories.length > 0) {
    //       runners = runners.filter(
    //         (item) => categories.indexOf(item.category) >= 0
    //       );
    //     }

    //     // filter team
    //     if (teams && teams.length > 0) {
    //       runners = runners.filter((item) => teams.indexOf(item.team) >= 0);
    //     }

    //     // get score for each ps
    //     const pss = await this.getAllPSs(race);
    //     const map = new Map();
    //     for (const ps of pss) {
    //       const psResults = await this.getScoreFull(ps.id, race);
    //       for (const result of psResults) {
    //         if (!result.diff) continue;
    //         let psRunnerRes = map.get(result.runner.number);
    //         if (!psRunnerRes) psRunnerRes = [];
    //         psRunnerRes.push(result.diff);
    //         map.set(result.runner.number, psRunnerRes);
    //       }
    //     }

    //     // calcolate diff, only for selected runners
    //     let tmpResult = [];
    //     for (const runner of runners) {
    //       const values = map.get(runner.number);

    //       let diff = null;
    //       if (values && values.length == pss.length) {
    //         diff = 0;
    //         for (const val of values) {
    //           diff += val;
    //         }
    //       }

    //       tmpResult.push({
    //         ...runner,
    //         diff,
    //       });
    //     }

    //     // order
    //     tmpResult = tmpResult.sort((a, b) => {
    //       if (a.diff == b.diff) return 0;
    //       if (a.diff == null || a.diff == undefined) return 1;
    //       if (b.diff == null || b.diff == undefined) return -1;
    //       return a.diff - b.diff;
    //     });

    //     // make results and set position
    //     let results = [];
    //     for (let i = 0; i < tmpResult.length; i++) {
    //       results.push({
    //         pos: i + 1,
    //         ...tmpResult[i],
    //       });
    //     }

    //     return results;
    //   }

    //   ///////////// GLOBAL
    //   async clear() {
    //     this.db.tables.forEach(function (table) {
    //       table.clear();
    //     });
    //   }

    /**
     * Create standard ID for race, time, runner, ps
     * @param {*} type The type
     * @param {*} name The name / id of the element
     * @param {*} raceId The raceId
     * @returns The DB _id
     */
    _makeId(type, name, raceId = '') {
        let id = raceId ? `${raceId}::${type}:${name}` : `${type}:${name}`;
        return this._normalize(id);
    }

    /**
     * Create a Take ID, a take ID is an ID obtained from merging all the parameters
     * @param {*} ps
     * @param {*} runner
     * @param {*} race
     */
    _makeTakeId(ps, runner, race) {
        const psN = ps.replace(race + '::', '');
        const runnerN = runner.replace(race + '::', '');
        let id = `${race}::take:[${psN}:${runnerN}]`;
        return this._normalize(id);
    }

    /**
     * Normalize the string
     * @param {*} str
     * @returns
     */
    _normalize(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^0-9a-z-:\[\]]/g, '');
    }
}

/**
 * @returns {DBManager} the dbManager
 */
export const getDBManager = () => {
    if (!window.rcDbManager) {
        window.rcDbManager = new DBManager();
    }
    return window.rcDbManager;
};
