import Papa from 'papaparse';
import Component from '../../libs/component';
import { getDBManager } from '../../libs/db-manager';
import { formToJSON } from '../../libs/form-to-json';
import { getStoreManager } from '../../libs/store-manager';
import { dateToDiffTimeStr, printTable } from '../../libs/utils';
import template from './template.hbs';

class M5Results extends Component {
    constructor() {
        super();

        this.dbManager = getDBManager();
        this._init();
    }

    async _init() {
        // load raceId
        const selectedRace = getStoreManager().get('selectedRace');
        this.raceId = selectedRace.race;
        this.tableVersion = '';

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
        this.resultsTable = this._ref('results');
        this.uciTable = this._ref('uciResults');
        this.currentTable = this.resultsTable;

        this._addListener(
            'click',
            (event) => {
                event.preventDefault();
                this._download();
            },
            'download'
        );

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                const data = formToJSON(event.target);
                this.categories = Object.keys(data);
                this.resultsTable.reload();
                this.uciTable.reload();
            },
            'selectCategories'
        );

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                const data = formToJSON(event.target);
                this.teams = data.selectTeam ? [data.selectTeam] : [];
                this.resultsTable.reload();
                this.uciTable.reload();
            },
            'selectTeams'
        );

        this._addListener(
            'change',
            (event) => {
                event.preventDefault();
                const value = event.target.value;
                if (value == 'uci') {
                    this.currentTable = this.uciTable;
                    this.uciTable.classList.remove('hidden');
                    this.resultsTable.classList.add('hidden');
                } else {
                    this.currentTable = this.resultsTable;
                    this.uciTable.classList.add('hidden');
                    this.resultsTable.classList.remove('hidden');
                }
            },
            'tableVersion'
        );

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                const data = formToJSON(event.target);
                this._print(data);
            },
            'print'
        );
    }

    async getRows() {
        return await this.dbManager.getGlobalScore(this.raceId, this.categories, this.teams);
    }

    async _download() {
        let rows = await this.getRows();
        console.log(rows);
        rows = rows.map((item) => ({
            number: item.number,
            name: item.name,
            team: item.team,
            category: item.category,
            diff: dateToDiffTimeStr(item.diff, true),
            uci: item.uci,
            fci: item.fci,
            soc: item.soc,
            naz: item.naz,
        }));
        const csv = Papa.unparse(rows);
        const csvContent = 'data:text/csv;charset=utf-8,' + csv;
        window.open(encodeURI(csvContent));
    }

    async _print(data) {
        const title = `<h1 class="text-3xl font-bold mb-4 mt-8">${data.title || 'Risultati'}</h1>`;
        let subtitle = '';
        if (!data.subtitle) {
            if (this.categories.length > 0)
                subtitle += `<p class="mt-2 text-lg mb-4">Categorie: <b class="text-xl">${this.categories.join(
                    ' - '
                )}</b></p>`;
            if (this.teams.length > 0)
                subtitle += `<p class="mt-2 text-lg mb-4">Team: <b class="text-xl">${this.teams.join(' - ')}</b></p>`;
        } else {
            subtitle += `<p class="mt-2 text-lg mb-4">${data.subtitle}</p>`;
        }

        const table = this.currentTable.querySelector('[ref=printTable]');
        printTable(title, subtitle, table.innerHTML);
    }
}

export default M5Results;
