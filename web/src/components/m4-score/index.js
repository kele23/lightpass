import Component from '../../libs/component';
import template from './template.hbs';
import { getDBManager } from '../../libs/db-manager';
import { getStoreManager } from '../../libs/store-manager';
import Papa from 'papaparse';

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

        this.category = null;

        const data = {
            categories: await this.dbManager.getAllCategories(this.raceId),
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
            'change',
            (event) => {
                event.preventDefault();
                this.category = event.target.value;
                this.table.reload();
            },
            'selectCategory'
        );
    }

    async getRows() {
        return await this.dbManager.getScore(this.psId, this.raceId, this.category);
    }

    async _download() {
        const rows = await this.getRows();
        const csv = Papa.unparse(rows);
        const csvContent = 'data:text/csv;charset=utf-8,' + csv;
        window.open(encodeURI(csvContent));
    }
}

export default M4Score;
