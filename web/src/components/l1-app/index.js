import Component from '../../libs/component';
import template from './template.hbs';
import { emptyElement } from '../../libs/utils';

class L1App extends Component {
    constructor() {
        super();

        // parse html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(template(), 'text/html');
        this.appendChild(htmlDoc.body.firstElementChild);

        this.content = this._ref('content');
        this._addListeners();
    }

    connectedCallback() {
        console.log('start');
        setTimeout(() => {
            this.firstElementChild.classList.remove('opacity-0');
        }, 500);
    }

    _addListeners() {
        this._addStoreListener('selectedRace', (path, value) => {
            emptyElement(this.content);
            if (value.race) this.content.innerHTML = '<l2-main></l2-main>';
            else this.content.innerHTML = '<m0-racer></m0-racer>';
        });
    }
}

export default L1App;
