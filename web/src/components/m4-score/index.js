import Component from '../../libs/component';
import template from './template.hbs';
import { getDBManager } from '../../libs/db-manager';
import { getStoreManager } from '../../libs/store-manager';
import Papa from 'papaparse';
import { dateToTime, dateToDiffTimeStr, printTable, dateToStr, readFileAsync } from '../../libs/utils';
import { formToJSON } from '../../libs/form-to-json';
import C3Confirm from '../c3-confirm';

class M4Score extends Component {
    constructor() {
        super();

        this.dbManager = getDBManager();
        this._init();
    }

    async _init() {
        // load raceId
        const selectedRace = getStoreManager().get('selectedRace');
        this.raceId = selectedRace.race;

        const selectedPage = getStoreManager().get('selectedPage');
        this.psId = selectedPage.destination.substring(3);

        this.categories = [];
        this.teams = [];

        const data = {
            categories: await this.dbManager.getAllCategories(this.raceId),
            teams: await this.dbManager.getAllTeams(this.raceId),
        };

        // parse html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(template(data), 'text/html');
        this.appendChild(htmlDoc.body.firstElementChild);

        //get table
        this.table = this._ref('table');

        this._addListener(
            'click',
            (event) => {
                event.preventDefault();
                this._download();
            },
            'download'
        );

        this._addListener(
            'click',
            (event) => {
                event.preventDefault();
                this._print();
            },
            'print'
        );

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                const data = formToJSON(event.target);
                this.categories = Object.keys(data);
                this.table.reload();
            },
            'selectCategories'
        );

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                const data = formToJSON(event.target);
                this.teams = data.selectTeam ? [data.selectTeam] : null;
                this.table.reload();
            },
            'selectTeams'
        );

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                this._uploadPsScore(event.target);
            },
            'uploadPsScore'
        );
    }

    async getRows() {
        return await this.dbManager.getScore(this.psId, this.raceId, this.categories, this.teams);
    }

    async _uploadPsScore(form) {
        const files = form.querySelector('[type=file]').files;
        if (!files) return;

        const selection = await C3Confirm.openAndWait('default');
        if (!selection) return;

        //clean take for ps
        await this.dbManager.cleanTakeByPs({ race: this.raceId, ps: this.psId });

        //read file
        const f = files[0];
        const arrayBuffer = await readFileAsync(f);
        const decoder = new TextDecoder('utf-8');
        const csv = decoder.decode(arrayBuffer);

        //read csv
        const results = Papa.parse(csv, {
            header: true,
        });

        // get all runners
        let runners = await this.dbManager.getAllRunner(this.raceId);
        runners = runners.reduce((result, item) => {
            result[item.number] = item;
            return result;
        }, {});

        //add item
        const rows = results.data;
        for (const row of rows) {
            const runner = runners[row.number]?.id;
            if (!runner) continue; // skip if runner not found
            if (!row.endIso) continue; // skip if no end

            const endDate = new Date(row.endIso);
            const time = await this.dbManager.addTime({ time: endDate.getTime(), race: this.raceId });
            const pen = row.pen ? parseInt(row.pen) : 0;

            await this.dbManager.createTake({ race: this.raceId, ps: this.psId, runner, time, pen });
        }

        await this.table.reload();
        form.reset();
    }

    async _download() {
        let rows = await this.getRows();
        console.log(rows);
        rows = rows.map((item) => ({
            number: item.number,
            name: item.name,
            team: item.team,
            category: item.category,
            start: dateToStr(item.start, true),
            startIso: new Date(item.start).toISOString(),
            end: dateToStr(item.end, true),
            endIso: item.end ? new Date(item.end).toISOString() : null,
            diff: dateToDiffTimeStr(item.diff, true),
            diffMs: item.diff,
            pen: item.pen,
            uci: item.uci,
            fci: item.fci,
            soc: item.soc,
            naz: item.naz,
        }));
        const csv = Papa.unparse(rows);
        const csvContent = 'data:text/csv;charset=utf-8,' + csv;
        window.open(encodeURI(csvContent));
    }

    async _print() {
        const title = `<h1 class="text-3xl font-bold mb-4 mt-8">Risultati</h1>`;
        let subtitle = '';
        if (this.categories.length > 0) {
            subtitle += `<p class="mt-2 text-lg mb-4">Categorie: <b class="text-xl">${this.categories.join(
                ' - '
            )}</b></p>`;
        }
        if (this.teams.length > 0) {
            subtitle += `<p class="mt-2 text-lg mb-4">Team: <b class="text-xl">${this.teams.join(' - ')}</b></p>`;
        }
        printTable(title, subtitle, this._ref('printTable').innerHTML);
    }
}

export default M4Score;
