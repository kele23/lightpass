import template from './template.hbs';
import Component from '../../libs/component';
import { buildWaitForEvent } from '../../libs/utils';

const waitForClose = buildWaitForEvent('close');

class C3Confirm extends Component {
    constructor() {
        super();
        this._init();
    }

    async _init() {
        const data = {};

        // parse html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(template(data), 'text/html');
        this.appendChild(htmlDoc.body.firstElementChild);

        // get elements
        this.yesBtn = this._ref('yes');
        this.noBtn = this._ref('no');
        this.backdropBtn = this._ref('backdrop');
        this.root = this._ref('root');

        this._addListener(
            'click',
            () => {
                this.close(true);
            },
            this.yesBtn
        );

        this._addListener(
            'click',
            () => {
                this.close();
            },
            this.noBtn
        );

        this._addListener(
            'click',
            () => {
                this.close();
            },
            this.backdropBtn
        );

        this.root.addEventListener('keydown', (evt) => {
            if (evt.key === 'Escape') {
                this.close();
            }
        });
    }

    close(selection = false) {
        this.dispatchEvent(new CustomEvent('close', { detail: selection }));
        this.root.classList.add('hidden');
    }

    open() {
        this.root.classList.remove('hidden');
        this.noBtn?.focus();
    }

    static async openAndWait(name) {
        const dialog = document.querySelector(`[name=${name}]`);
        if (!dialog) return;
        dialog.open();

        const event = await waitForClose(dialog);
        if (event.detail) return true;
        return false;
    }
}

export default C3Confirm;
