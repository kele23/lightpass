import Component from '../../libs/component';
import { getDBManager } from '../../libs/db-manager';
import { formToJSON, jsonToForm } from '../../libs/form-to-json';
import { getStoreManager } from '../../libs/store-manager';
import { dateToTime } from '../../libs/utils';
import C4Penalty from '../c4-penalty';
import template from './template.hbs';

class M1Dashboard extends Component {
    constructor() {
        super();

        this.dbManager = getDBManager();
        this._init();

        //add take event listener
        this._addListener(
            'take-event',
            (event) => {
                this._newTime(event.detail.time);
            },
            document.body
        );

        this._addStoreListener('selectedPS', (path, data) => {
            this.ps = data;
            this.takeTable?.reload();
            this.scoreTable?.reload();

            if (data) {
                this.scoreTableDiv?.classList.remove('hidden');
            } else {
                this.scoreTableDiv?.classList.add('hidden');
            }
        });
    }

    async _init() {
        // load raceId
        const selectedRace = getStoreManager().get('selectedRace');
        this.raceId = selectedRace.race;

        const selectedPS = getStoreManager().get('selectedPS');
        this.ps = selectedPS;

        // parse html
        let pss = await this.dbManager.getAllPS(this.raceId);
        pss = pss.map((item) => (item.id == this.ps?.id ? { ...item, selected: true } : item));
        const data = {
            pss,
            selectedPs: this.ps ? true : false,
        };

        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(template(data), 'text/html');
        this.appendChild(htmlDoc.body.firstElementChild);

        //get table
        this.timeTable = this._ref('timeTable');
        this.takeTable = this._ref('takeTable');
        this.scoreTable = this._ref('scoreTable');
        this.scoreTableDiv = this._ref('scoreTableDiv');
        this.assignTime = this._ref('assignTime');
        this.selectPs = this._ref('selectPs');

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                this._assignTime(formToJSON(this.assignTime));
            },
            this.assignTime
        );

        this._addListener(
            'change',
            (event) => {
                event.preventDefault();
                this._selectPs(this.selectPs.value);
            },
            this.selectPs
        );
    }

    async getRows(type) {
        if (type == 'take') {
            return await this.dbManager.getAllTakeJoinWithoutScore(this.raceId, this.ps?.id);
        }
        if (type == 'time') {
            return await this.dbManager.getAllTimeJoin(this.raceId, true);
        }
        if (type == 'score') {
            if (!this.ps?.id) return [];
            return await this.dbManager.getAllTakeJoinWithScore(this.raceId, this.ps.id);
        }
    }

    async deleteRow(id, type) {
        if (type == 'time') {
            const time = await this.dbManager.getTimeJoin(id);
            if (time.assigned) {
                console.warn('Time is assigned, cannot remove');
                return false;
            }
            await this.dbManager.deleteTime({ id });
            return true;
        }
        if ((type == 'take' || type == 'score') && id) {
            await this.dbManager.deleteTake({ id });
            await this.timeTable.reload();
            await this.takeTable.reload();
            await this.scoreTable.reload();
            return false;
        }
    }

    async editRow(id, type) {
        if (type == 'time') {
            const time = await this.dbManager.getTime(id);
            this._setTime(time);
        }
        if (type == 'take') {
            const penalty = await C4Penalty.openAndWait('default');
            if (penalty == -1) return;
            this.dbManager.setPenalty(id, penalty);
        }
    }

    async _newTime(time) {
        if (!this.timeTable) return;

        // add to row to table
        this.timeTable?.addRow(time);

        // check focus
        if (this.assignTime.contains(document.activeElement)) return;

        // configure form
        this._setTime(time);
    }

    _setTime(time) {
        // compile form
        const formData = {
            ...time,
            psName: this.ps?.name,
            timeStr: dateToTime(new Date(time.time), true),
        };
        jsonToForm(this.assignTime, formData);

        // focus
        this._flickBg(this.assignTime, 'bg-blue-300');
        this.assignTime.querySelector('[name=runnerNum]').focus();
    }

    async _assignTime(json) {
        if (!json.id) {
            console.warn('Cannot assign time without a Time ID');
            this._flickBg(this.assignTime, 'bg-red-300');
            return;
        }

        const ps = await this.dbManager.getPSBy({ name: json.psName, race: this.raceId });
        const runner = await this.dbManager.getRunnerBy({ number: json.runnerNum, race: this.raceId });

        if (!ps || !runner) {
            console.warn('Cannot find PS or Runner');
            this._flickBg(this.assignTime, 'bg-red-300');
            return;
        }

        const take = await this.dbManager.getTakeBy({ ps: ps.id, runner: runner.id, race: this.raceId });
        if (take) {
            console.warn('Take already exists for this PS and Runner');
            this._flickBg(this.assignTime, 'bg-red-300');
            return;
        }

        await this.dbManager.createTake({ time: json.id, ps: ps.id, runner: runner.id, race: this.raceId });

        this._flickBg(this.assignTime, 'bg-green-300');
        this.assignTime.reset();

        // remove focus
        document.activeElement.blur();

        await this.takeTable.reload();
        await this.timeTable.reload();
        await this.scoreTable.reload();
    }

    _flickBg(element, bg) {
        setTimeout(() => {
            element.classList.remove(bg);
            element.classList.add('bg-white');
        }, 300);
        element.classList.add(bg);
        element.classList.remove('bg-white');
    }

    async _selectPs(psId) {
        if (!psId) {
            this._emit('selectedPS', null);
        } else {
            const ps = await this.dbManager.getPS(psId);
            this._emit('selectedPS', ps);
        }
    }
}

export default M1Dashboard;
