import Component from '../../libs/component';
import { getDBManager } from '../../libs/db-manager';
import { getStoreManager } from '../../libs/store-manager';
import { emptyElement } from '../../libs/utils';
import template from './template.hbs';

class C2Nav extends Component {
    constructor() {
        super();
        this.dbManager = getDBManager();
        this._init();

        this._addStoreListener('psChange', () => {
            this.reload();
        });
    }

    async _init() {
        const data = {};

        const selectedRace = getStoreManager().get('selectedRace');
        this.raceId = selectedRace.race;

        const ps = await this.dbManager.getAllPS(this.raceId);
        data['ps'] = ps;

        // parse html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(template(data), 'text/html');
        this.appendChild(htmlDoc.body.firstElementChild);

        // add listener to buttons
        this._addListener(
            'click',
            (event) => {
                const button = event.currentTarget;
                this._emit('selectedPage', {
                    destination: button.dataset.destination,
                    title: button.dataset.title,
                });
                this.checkActiveMenu();
            },
            'menuItem'
        );

        //check active button
        this.checkActiveMenu();
    }

    reload() {
        emptyElement(this);
        this._init();
    }

    checkActiveMenu() {
        const selectedPage = getStoreManager().get('selectedPage');
        const destination = selectedPage?.destination || 'dashboard';

        const menuItems = this._ref('menuItem', true);
        for (const item of menuItems) {
            if (item.dataset.destination == destination) {
                item.classList.remove('text-gray-400');
                item.classList.remove('border-transparent');
                item.classList.add('text-gray-800');
                item.classList.add('border-gray-500');
            } else {
                item.classList.add('text-gray-400');
                item.classList.add('border-transparent');
                item.classList.remove('text-gray-800');
                item.classList.remove('border-gray-500');
            }
        }
    }
}

export default C2Nav;
