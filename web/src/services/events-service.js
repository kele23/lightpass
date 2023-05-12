import { getDBManager } from './db-manager';
import router from './router';

class EventService {
    constructor() {
        if (!window.EventSource) throw 'Cannot start lightpass EventService, window.EventSource need to be defined';
    }

    start() {
        this.source = new EventSource('/events');
        this.initDate = null;
        this.initMillis = null;
        this.raceId = null;

        this.dbManager = getDBManager();

        this._addSourceListeners();
        this._addFakeListeners();
        this._addRouteListeners();
    }

    _addSourceListeners() {
        this.source.addEventListener(
            'open',
            () => {
                console.log('Lightpass sensor Connected');
            },
            false
        );

        this.source.addEventListener(
            'error',
            (e) => {
                if (e.target.readyState != EventSource.OPEN) {
                    console.log('Lightpass sensor Disconnected');
                }
            },
            false
        );

        this.source.addEventListener(
            'init-event',
            (e) => {
                this._initEvent(e);
            },
            false
        );

        this.source.addEventListener(
            'take-event',
            (e) => {
                this._takeEvent(e);
            },
            false
        );
    }

    _addFakeListeners() {
        document.body.addEventListener('keypress', (e) => {
            if (e.code == 'BracketRight' || e.code == 'NumpadAdd')
                if (e.shiftKey) this._customTime();
                else this._sendEvent(new Date());
        });
    }

    _addRouteListeners() {
        // race route listener
        this.raceId = null;
        router.afterEach((to) => {
            this.raceId = to.params.race;
        });
    }

    _initEvent(e) {
        this.initDate = new Date();
        this.initMillis = e.data;
        console.log(
            `Initialized events at ${this.initDate} (${this.initDate.getTime()}) with millis ${this.initMillis}`
        );
    }

    _takeEvent(e) {
        if (!this.initDate || !this.initMillis) throw 'Missing init event';

        const newDateMillis = this.initDate.getTime() + (e.data - this.initMillis);
        const currentDate = new Date(newDateMillis);
        console.log(`Taked event at ${currentDate} (${currentDate.getTime()}) with millis ${e.data}`);

        this._sendEvent(currentDate);
    }

    async _sendEvent(takedDate) {
        if (!this.raceId) console.warn('Please select a race');

        console.log(`Propagated event for race ${this.raceId} with date ${takedDate} (${takedDate.getTime()})`);
        const doc = await this.dbManager.addTime({ time: takedDate.getTime(), race: this.raceId });
        const custom = new CustomEvent('take-event', { detail: doc.id });
        document.body.dispatchEvent(custom);
    }

    async _customTime() {
        /*const takedDate = await C5CustomTime.openAndWait('default');
        if (takedDate) this._sendEvent(takedDate);*/
    }
}

/**
 *
 * @returns {EventService}
 */
export const getEventService = () => {
    if (!window.rcEventService) {
        window.rcEventService = new EventService();
    }
    return window.rcEventService;
};
