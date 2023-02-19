import Component from '../../libs/component';
import { getDBManager } from '../../libs/db-manager';
import { formToJSON, jsonToForm } from '../../libs/form-to-json';
import { getStoreManager } from '../../libs/store-manager';
import { dateToStr } from '../../libs/utils';
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
    }

    async _init() {
        // load raceId
        const selectedRace = getStoreManager().get('selectedRace');
        this.raceId = selectedRace.race;

        // parse html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(template({}), 'text/html');
        this.appendChild(htmlDoc.body.firstElementChild);

        //get table
        this.timeTable = this._ref('timeTable');
        this.takeTable = this._ref('takeTable');
        this.assignTime = this._ref('assignTime');

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                this._assignTime(formToJSON(this.assignTime));
            },
            this.assignTime
        );
    }

    async getRows(type) {
        if (type == 'take') {
            return await this.dbManager.getAllTakeJoin(this.raceId);
        }
        if (type == 'time') {
            return await this.dbManager.getAllTimeJoin(this.raceId, true);
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
        if (type == 'take') {
            await this.dbManager.deleteTake({ id });
            this.timeTable.reload();
            return true;
        }
    }

    async editRow(id, type) {
        if (type == 'time') {
            const time = await this.dbManager.getTime(id);
            this._setTime(time);
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
            timeStr: dateToStr(new Date(time.time), true),
        };
        jsonToForm(this.assignTime, formData);

        // focus
        setTimeout(() => {
            this.assignTime.classList.remove('bg-blue-300');
        }, 1000);
        this.assignTime.classList.add('bg-blue-300');
        this.assignTime.querySelector('[name=runnerNum]').focus();
    }

    async _assignTime(json) {
        if (!json.id) {
            console.warn('Cannot assign time without a Time ID');
            return;
        }

        const ps = await this.dbManager.getPSBy({ name: json.psName, race: this.raceId });
        const runner = await this.dbManager.getRunnerBy({ number: json.runnerNum, race: this.raceId });

        if (!ps || !runner) {
            console.warn('Cannot find PS or Runner');
            setTimeout(() => {
                this.assignTime.classList.remove('bg-red-300');
            }, 1000);
            this.assignTime.classList.add('bg-red-300');
            return;
        }

        const take = await this.dbManager.getTakeBy({ ps: ps.id, runner: runner.id, race: this.raceId });
        if (take) {
            console.warn('Take already exists for this PS and Runner');
            setTimeout(() => {
                this.assignTime.classList.remove('bg-red-300');
            }, 1000);
            this.assignTime.classList.add('bg-red-300');
            return;
        }

        await this.dbManager.createTake({ time: json.id, ps: ps.id, runner: runner.id, race: this.raceId });

        setTimeout(() => {
            this.assignTime.classList.remove('bg-green-300');
        }, 1000);
        this.assignTime.classList.add('bg-green-300');
        this.assignTime.reset();

        this.takeTable.reload();
        this.timeTable.reload();
    }
}

export default M1Dashboard;
