import Component from '../../libs/component';
import { getDBManager } from '../../libs/db-manager';
import { formToJSON } from '../../libs/form-to-json';
import { dateToDiffTimeStr, dateToStr, dateToTime } from '../../libs/utils';
import C3Confirm from '../c3-confirm';
import rowTemplate from './row-template.hbs';
import template from './template.hbs';

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
        const title = this.getAttribute('title');
        const hideCount = this.getAttribute('hideCount');

        // global props
        this.rowsKey = this.getAttribute('rowsKey');
        this.editEnabled = this.getAttribute('editEnabled');
        this.actionDisabled = this.getAttribute('actionDisabled');
        this.keys = this.getAttribute('keys').split(',');
        this.types = this.getAttribute('types').split(',');
        this.orderBy = this.getAttribute('orderBy');
        this.orderDir = this.getAttribute('orderDir') || 'asc';
        this.filterKey = this.getAttribute('filterKey')?.split(',') || null;

        // get rows and generate
        const parent = this._parent();
        this.rows = await parent.getRows(this.rowsKey);
        const rowsHtmls = this._generateRows();

        const data = {
            labels,
            rowsHtmls,
            filterKey: this.filterKey,
            title,
            hideCount,
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

            const selection = await C3Confirm.openAndWait('default');
            if (!selection) return;

            const tr = event.target.closest('tr');
            const id = tr.dataset.id;
            const ok = await this._parent().deleteRow(id, this.rowsKey);
            if (ok) {
                tr.remove();
                this.rows = this.rows.filter((item) => item.id != id); // remove row
                if (this._ref('count')) this._ref('count').innerHTML = this.rows.length;
            }
        });

        this._addListener('click', async (event) => {
            if (!event.target.matches('[ref=editRow]')) return;
            const tr = event.target.closest('tr');
            const id = tr.dataset.id;
            await this._parent().editRow(id, this.rowsKey);
        });

        if (this._ref('filter'))
            this._addListener(
                'submit',
                (event) => {
                    event.preventDefault();
                    this.currentFilter = formToJSON(event.target)['filter'];
                    const rowsHtmlsJoin = this._generateRows().join('');
                    this.tableBody.innerHTML = rowsHtmlsJoin;
                },
                'filter'
            );
    }

    _rowMap(item) {
        const res = { id: item.id, data: [], editEnabled: this.editEnabled, actionDisabled: this.actionDisabled };
        for (let i = 0; i < this.keys.length; i++) {
            const key = this.keys[i];
            const type = this.types[i] || 'as-is';
            let data = item[key];

            switch (type) {
                case 'date-time':
                    data = dateToStr(item[key], true);
                    break;
                case 'penalty':
                    data =
                        item[key] && item[key] != 0 ? `${Math.sign(item[key]) > 0 ? '+' : '-'}${item[key]} sec` : null;
                    break;
                case 'time':
                    data = item[key]
                        ? `<span title="${dateToStr(item[key], true)}">${dateToTime(item[key], true)}</span>`
                        : null;
                    break;
                case 'diff':
                    data = data ? `<span class="font-bold">${dateToDiffTimeStr(item[key], true)}</span>` : null;
                    break;
                case 'bolder':
                    data = data ? '<span class="font-bold">' + data + '</span>' : null;
                    break;
                case 'smaller':
                    data = data ? '<span class="text-xs">' + data + '</span>' : null;
                    break;
                case 'pos':
                    data =
                        '<span class="font-bold inline-block rounded-md min-w-[42px] px-2 bg-white border text-center text-red-700 text-base">' +
                        data +
                        '</span>';
            }

            res.data.push({ key, data });
        }
        return res;
    }

    _generateRows() {
        let finalRows = this.rows;
        // filter data
        if (this.currentFilter && this.filterKey) {
            const regex = new RegExp(this.currentFilter, 'i');
            finalRows = finalRows.filter((item) => {
                for (const key of this.filterKey) {
                    if (regex.test(item[key])) return true;
                }
                return false;
            });
        }

        // order data
        if (this.orderBy) {
            finalRows.sort((one, two) => {
                const a = this.orderDir == 'asc' ? one : two;
                const b = this.orderDir == 'asc' ? two : one;

                if (a[this.orderBy] == b[this.orderBy]) {
                    return 0;
                }

                if (a[this.orderBy] === undefined || a[this.orderBy] === null) {
                    return 1;
                }
                if (b[this.orderBy] === undefined || b[this.orderBy] === null) {
                    return -1;
                }

                if (a[this.orderBy] < b[this.orderBy]) {
                    return -1;
                }
                if (a[this.orderBy] > b[this.orderBy]) {
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
        const parent = this._parent();
        this.rows = await parent.getRows(this.rowsKey);
        const rowsHtmlsJoin = this._generateRows().join('');
        this.tableBody.innerHTML = rowsHtmlsJoin;
        if (this._ref('count')) this._ref('count').innerHTML = this.rows.length;
    }

    addRow(row) {
        // add to rows
        const mappedRow = this._rowMap(row);
        this.rows.unshift(mappedRow);

        // ad to html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString('<table>' + rowTemplate(mappedRow) + '</table>', 'text/html');
        this.tableBody.insertBefore(htmlDoc.body.querySelector('tr'), this.tableBody.firstElementChild);
        if (this._ref('count')) this._ref('count').innerHTML = this.rows.length;
    }
}

export default C1Table;
