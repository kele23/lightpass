import Component from '../../libs/component';
import template from './template.hbs';
import race from '../../assets/race.webp';
import { getDBManager } from '../../libs/db-manager';

class M0Racer extends Component {
    constructor() {
        super();

        this.dbManager = getDBManager();
        this._init();
    }

    async _init() {
        const data = {
            img: race,
            options: await this.dbManager.getAllRace(),
        };

        // parse html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(template(data), 'text/html');
        this.appendChild(htmlDoc.body.firstElementChild);

        // get elements
        this.formCreate = this._ref('createRace');
        this.formSelect = this._ref('selectRace');

        // add listeners
        this._addListeners();
    }

    _addListeners() {
        this.formCreate.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(event.target);
            const raceName = formData.get('name');
            const id = await this.dbManager.createRace(raceName);

            this._emit('selectedRace', { race: id });
        });

        this.formSelect.addEventListener('submit', (event) => {
            event.preventDefault();

            const formData = new FormData(event.target);
            const id = formData.get('name');

            this._emit('selectedRace', { race: id });
        });
    }
}

export default M0Racer;
