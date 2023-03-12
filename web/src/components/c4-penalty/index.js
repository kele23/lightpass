import template from './template.hbs';
import Component from '../../libs/component';
import { buildWaitForEvent } from '../../libs/utils';
import { formToJSON } from '../../libs/form-to-json';

const waitForClose = buildWaitForEvent('close');

class C4Penalty extends Component {
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
        this.penaltyForm = this._ref('penaltyForm');
        this.noBtn = this._ref('no');
        this.backdropBtn = this._ref('backdrop');
        this.root = this._ref('root');

        this._addListener(
            'submit',
            (event) => {
                event.preventDefault();
                const data = formToJSON(event.target);
                this.close(parseInt(data.penalty));
            },
            this.penaltyForm
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

    close(penalty = -1) {
        this.dispatchEvent(new CustomEvent('close', { detail: penalty }));
        this.root.classList.add('hidden');
    }

    open() {
        this.penaltyForm?.reset();
        this.root.classList.remove('hidden');
        this.noBtn?.focus();
    }

    static async openAndWait(name) {
        const dialog = document.querySelector(`c4-penalty[name=${name}]`);
        if (!dialog) return;
        dialog.open();

        const event = await waitForClose(dialog);
        return event.detail;
    }
}

export default C4Penalty;
