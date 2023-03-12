import Component from '../../libs/component';
import template from './template.hbs';
import { getDBManager } from '../../libs/db-manager';
import { getStoreManager } from '../../libs/store-manager';
import Papa from 'papaparse';
import { dateToTime, dateToDiffTimeStr } from '../../libs/utils';
import { formToJSON } from '../../libs/form-to-json';

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

        this.categories = null;

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
            'click',
            (event) => {
                event.preventDefault();

                console.log(this._ref('printTable').innerHTML);

                const printWindow = window.open('', '', 'height=800,width=1000');
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Print</title>
                            <style>
                                @page { margin: 0; }
                                body {
                                    padding-left: 16px;
                                    padding-right: 16px;
                                }
                                .text-left {
                                    text-align: left;
                                }
                                .text-center {
                                    text-align: center;
                                }
                                .px-2 {
                                    padding-left: 4px;
                                    padding-right: 4px;
                                }
                                .py-3 {
                                    padding-top: 8px;
                                    padding-bottom: 8px;
                                }
                            </style>
                        </head>
                        <body>
                            <table>${this._ref('printTable').innerHTML}</table>
                        </body>
                    </html>`);

                //Print the Table CSS.

                printWindow.document.close();
                printWindow.print();
                printWindow.close();
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
    }

    async getRows() {
        return await this.dbManager.getScore(this.psId, this.raceId, this.categories);
    }

    async _download() {
        let rows = await this.getRows();
        console.log(rows);
        rows = rows.map((item) => ({
            number: item.number,
            name: item.name,
            team: item.team,
            category: item.category,
            start: dateToTime(item.start, true),
            end: dateToTime(item.end, true),
            diff: dateToDiffTimeStr(item.diff, true),
            uci: item.uci,
            fci: item.fci,
            societa: item.soc,
            nazionalita: item.naz,
        }));
        const csv = Papa.unparse(rows);
        const csvContent = 'data:text/csv;charset=utf-8,' + csv;
        window.open(encodeURI(csvContent));
    }
}

export default M4Score;
