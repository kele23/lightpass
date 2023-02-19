import Component from '../../libs/component';
import template from './template.hbs';
import { getDBManager } from '../../libs/db-manager';
import { formToJSON } from '../../libs/form-to-json';
import { getStoreManager } from '../../libs/store-manager';
import Papa from 'papaparse';
import { readFileAsync } from '../../libs/utils';

class M2Race extends Component {
    constructor() {
        super();

        this.dbManager = getDBManager();
        this._init();
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
        this.table = this._ref('table');

        //add listeners
        this._addListeners();
    }

    _addListeners() {
        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                this._createPs(event.target);
            },
            'createPs'
        );

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                this._uploadPs(event.target);
            },
            'uploadPs'
        );

        this._addListener(
            'click',
            (event) => {
                event.preventDefault();
                this._download();
            },
            'download'
        );
    }

    async _createPs(form) {
        const json = formToJSON(form);
        const data = { ...json, start: new Date(json.start).getTime(), race: this.raceId };
        await this.dbManager.createOrUpdatePS(data);
        await this.table.reload();
        form.reset();

        this._emit('psChange', true);
    }

    async _uploadPs(form) {
        const files = form.querySelector('[type=file]').files;
        if (!files) return;

        //clean
        await this.dbManager.cleanPS({ race: this.raceId });

        //read file
        const f = files[0];
        const arrayBuffer = await readFileAsync(f);
        const decoder = new TextDecoder('utf-8');
        const csv = decoder.decode(arrayBuffer);

        //read csv
        const results = Papa.parse(csv, {
            header: true,
        });

        //add item
        const rows = results.data;
        for (const row of rows) {
            await this.dbManager.createOrUpdatePS({
                ...row,
                start: parseInt(row.start),
                id: null,
                race: this.raceId,
            });
        }

        await this.table.reload();
        form.reset();
    }

    async getRows() {
        return await this.dbManager.getAllPS(this.raceId);
    }

    async deleteRow(id) {
        await this.dbManager.deletePS({ id });
    }

    async _download() {
        const rows = await this.getRows();
        const csv = Papa.unparse(rows);
        const csvContent = 'data:text/csv;charset=utf-8,' + csv;
        window.open(encodeURI(csvContent));
    }
}

export default M2Race;
