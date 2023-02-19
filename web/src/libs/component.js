import { getStoreManager } from './store-manager';

export default class Component extends HTMLElement {
    constructor() {
        super();
        this.setAttribute('component', true); // tag custom element
        this.storeManager = getStoreManager();
        this.listeners = [];
        this.storeListeners = [];
    }

    async dispose() {
        this._removeAllListeners();
        this._removeAllStoreListeners();
    }

    _addListener(ev, cb, el = 'root', startFrom = null, options = {}) {
        //load events
        let events = [];
        if (typeof ev == 'string') {
            events = [ev];
        } else if (ev instanceof Array) {
            events = ev;
        } else {
            console.warn('Invalid addListener call');
            return;
        }

        //load elements if necessary
        let elements = [];
        if (el == 'root') {
            elements = [this];
        } else if (typeof el == 'string') {
            elements = this._ref(el, true, startFrom);
        } else if (el instanceof Element || el instanceof Document || el instanceof Window) {
            elements = [el];
        }

        //check element
        if (elements.length <= 0) {
            console.debug('Event listener not added due to missing element', el);
            return;
        }

        for (const element of elements) {
            for (const event of events) {
                this._addListenerTo(element, event, cb, options);
            }
        }
    }

    _addListenerTo(element, event, callback, options = {}) {
        element.addEventListener(event, callback, options);
        this.listeners.push({
            element: element,
            event: event,
            callback: callback,
            options: options,
        });
    }

    _removeAllListeners() {
        for (const listener of this.listeners) {
            listener.element.removeEventListener(listener.event, listener.callback, listener.options);
        }
    }

    // Store
    _emit(path, data, merge = false) {
        this.storeManager.emit(path, data, merge);
    }

    _addStoreListener(match, cb) {
        this.storeManager.addListener(match, cb);
        this.storeListeners.push({
            match,
            callback: cb,
        });
    }

    _removeAllStoreListeners() {
        for (const listener of this.storeListeners) {
            this.storeManager.removeListener(listener.match, listener.callback);
        }
    }

    //elements methods
    _ref(name, all = false, startFrom = null) {
        const startEl = startFrom ? startFrom : this;
        if (all) {
            return Array.from(startEl.querySelectorAll(`[ref=${name}]`));
        } else {
            return startEl.querySelector(`[ref=${name}]`);
        }
    }

    _parent() {
        return this.parentElement.closest(`[component=true]`);
    }
}
