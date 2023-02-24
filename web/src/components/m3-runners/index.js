import Component from '../../libs/component';
import template from './template.hbs';
import { getDBManager } from '../../libs/db-manager';
import { formToJSON } from '../../libs/form-to-json';
import { getStoreManager } from '../../libs/store-manager';
import Papa from 'papaparse';
import { readFileAsync } from '../../libs/utils';

class M3Runners extends Component {
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
                this._createRunner(event.target);
            },
            'createRunner'
        );

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                this._uploadRunner(event.target);
            },
            'uploadRunner'
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

    async _createRunner(form) {
        const data = { ...formToJSON(form), race: this.raceId };
        await this.dbManager.createOrUpdateRunner(data);
        await this.table.reload();
        form.reset();
    }

    async _uploadRunner(form) {
        const files = form.querySelector('[type=file]').files;
        if (!files) return;

        //clean
        await this.dbManager.cleanRunner({ race: this.raceId });

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
            await this.dbManager.createOrUpdateRunner({ ...row, id: null, race: this.raceId });
        }

        await this.table.reload();
        form.reset();
    }

    async getRows() {
        return await this.dbManager.getAllRunner(this.raceId);
    }

    async deleteRow(id) {
        await this.dbManager.deleteRunner({ id });
        return true;
    }

    async _download() {
        const rows = await this.getRows();
        const csv = Papa.unparse(rows);
        const csvContent = 'data:text/csv;charset=utf-8,' + csv;
        window.open(encodeURI(csvContent));
    }
}

export default M3Runners;
