import Component from '../../libs/component';
import { getDBManager } from '../../libs/db-manager';
import { dateToStr, dateToDiffTimeStr, emptyElement } from '../../libs/utils';
import template from './template.hbs';
import rowTemplate from './row-template.hbs';
import { formToJSON } from '../../libs/form-to-json';

class C1Table extends Component {
    constructor() {
        super();
        this.dbManager = getDBManager();
        this._init();
    }

    connectedCallback() {}

    async _init() {
        // static props
        const labels = this.getAttribute('labels').split(',');
        const filterKey = this.getAttribute('filterKey');
        const title = this.getAttribute('title');

        // global props
        this.rowsKey = this.getAttribute('rowsKey');
        this.editEnabled = this.getAttribute('editEnabled');
        this.actionDisabled = this.getAttribute('actionDisabled');
        this.keys = this.getAttribute('keys').split(',');
        this.orderBy = this.getAttribute('orderBy');
        this.orderDir = this.getAttribute('orderDir') || 'asc';

        // get rows and generate
        const parent = this._parent();
        this.rows = await parent.getRows(this.rowsKey);
        const rowsHtmls = this._generateRows();

        const data = {
            labels,
            rowsHtmls,
            filterKey,
            title,
            actionDisabled: this.actionDisabled,
        };

        // parse html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(template(data), 'text/html');
        this.appendChild(htmlDoc.body.firstElementChild);

        this.tableBody = this._ref('tbody');

        this._addListeners();
    }

    _addListeners() {
        this._addListener('click', async (event) => {
            if (!event.target.matches('[ref=deleteRow]')) return;
            const tr = event.target.closest('tr');
            const id = tr.dataset.id;
            const ok = await this._parent().deleteRow(id, this.rowsKey);
            if (ok) {
                tr.remove();
                this.rows = this.rows.filter((item) => item.id != id); // remove row
                this._ref('count').innerHTML = this.rows.length;
            }
        });

        this._addListener('click', async (event) => {
            if (!event.target.matches('[ref=editRow]')) return;
            const tr = event.target.closest('tr');
            const id = tr.dataset.id;
            await this._parent().editRow(id, this.rowsKey);
        });

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                this.currentFilter = formToJSON(event.target);
                emptyElement(this.tableBody);
                const rowsHtmlsJoin = this._generateRows().join('');
                this.tableBody.innerHTML = rowsHtmlsJoin;
            },
            'filter'
        );
    }

    _rowMap(item) {
        const res = { id: item.id, data: [], editEnabled: this.editEnabled, actionDisabled: this.actionDisabled };
        for (const key of this.keys) {
            if (key == 'start') res.data.push(dateToStr(item[key]));
            else if (key == 'time' || key == 'end' || key == 'assignedTime') res.data.push(dateToStr(item[key], true));
            else if (key == 'diff') res.data.push(dateToDiffTimeStr(item[key], true));
            else res.data.push(item[key]);
        }
        return res;
    }

    _generateRows() {
        let finalRows = this.rows;
        // filter data
        if (this.currentFilter) {
            for (const key of Object.keys(this.currentFilter)) {
                finalRows = finalRows.filter((item) => {
                    var regex = new RegExp(this.currentFilter[key], 'i');
                    if (regex.test(item[key])) return true;
                    return false;
                });
            }
        }

        // order data
        if (this.orderBy) {
            finalRows.sort((one, two) => {
                const a = this.orderDir == 'asc' ? one : two;
                const b = this.orderDir == 'asc' ? two : one;

                if (a[this.orderBy] === undefined) {
                    return 1;
                }
                if (b[this.orderBy] === undefined) {
                    return -1;
                }

                if (a[this.orderBy] < b[this.orderBy]) {
                    return -1;
                }
                if (a[this.orderBy] >= b[this.orderBy]) {
                    return 1;
                }
            });
        }

        // map for layout
        finalRows = finalRows.map((item) => this._rowMap(item));

        // render rows
        const rowsHtmls = [];
        for (const row of finalRows) {
            rowsHtmls.push(rowTemplate(row));
        }
        return rowsHtmls;
    }

    async reload() {
        emptyElement(this.tableBody);
        const parent = this._parent();
        this.rows = await parent.getRows(this.rowsKey);
        const rowsHtmlsJoin = this._generateRows().join('');
        this.tableBody.innerHTML = rowsHtmlsJoin;
        this._ref('count').innerHTML = this.rows.length;
    }

    addRow(row) {
        // add to rows
        const mappedRow = this._rowMap(row);
        this.rows.unshift(mappedRow);

        // ad to html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString('<table>' + rowTemplate(mappedRow) + '</table>', 'text/html');
        this.tableBody.insertBefore(htmlDoc.body.querySelector('tr'), this.tableBody.firstElementChild);
        this._ref('count').innerHTML = this.rows.length;
    }
}

export default C1Table;
