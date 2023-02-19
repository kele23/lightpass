export class StoreManager {
    constructor() {
        this.rootEl = document.documentElement;
        this.stores = {};
        this.cbs = {};
    }

    _checkInit(initialStore) {
        if (!initialStore || initialStore == 'undefined') return;
        const stores = typeof initialStore == 'string' ? JSON.parse(initialStore) : initialStore;
        for (var st of Object.keys(stores)) {
            this.emit(st, stores[st]);
        }
        console.log('Initializated store manager');
    }

    addListener(match, cb) {
        const regex = match instanceof RegExp ? match : new RegExp('^' + match + '.*$');
        const fFn = (event) => {
            const pathChanged = event.detail.path;
            if (regex.test(pathChanged)) {
                cb(pathChanged, event.detail.newData, event.detail.oldData);
            }
        };

        this.rootEl.addEventListener('ecStoreChange', fFn);
        this.cbs[cb] = fFn;

        // check pre-init
        (async () => {
            for (const st of Object.keys(this.stores)) {
                if (regex.test(st)) {
                    cb(st, this.stores[st], {});
                }
            }
        })();
    }

    removeListener(match, cb) {
        const fFn = this.cbs[cb];
        this.rootEl.removeEventListener('ecStoreChange', fFn);
    }

    emitIncrement(path) {
        const oldValue = this._recLookup(this.stores, path);
        let newValue = 0;
        if (!oldValue) {
            newValue = 1;
        } else if (typeof newValue == 'number') {
            newValue = oldValue + 1;
        }

        this.emit(path, newValue);
    }

    emitDecrement(path) {
        const oldValue = this._recLookup(this.stores, path);
        let newValue = 0;
        if (!oldValue) {
            newValue = -1;
        } else if (typeof newValue == 'number') {
            newValue = oldValue - 1;
        }

        this.emit(path, newValue);
    }

    emitToggle(path) {
        const oldValue = this._recLookup(this.stores, path);
        let newValue = true;
        if (typeof newValue == 'boolean') {
            newValue = !oldValue;
        }

        this.emit(path, newValue);
    }

    emit(path, data, merge = false) {
        const oldData = this._recLookup(this.stores, path) || {};
        let newData = data;
        if (merge && typeof data == 'object' && typeof oldData == 'object') {
            newData = { ...oldData, ...data };
        }

        //set store
        this.stores = this._recSetup(this.stores, path, newData);

        //send event
        let event = new CustomEvent('ecStoreChange', {
            detail: {
                path,
                oldData,
                newData,
            },
        });
        this.rootEl.dispatchEvent(event);
        console.debug(`Changed store "${path}" to`, newData);
    }

    get(path) {
        return this._recLookup(this.stores, path);
    }

    _recLookup(obj, path) {
        if (!obj) return null;
        const parts = path.split('/');
        if (parts.length == 1) {
            return obj[parts[0]];
        }
        return this._recLookup(obj[parts[0]], parts.slice(1).join('/'));
    }

    _recSetup(obj, path, data) {
        const nObj = obj;
        const parts = path.split('/');
        let iObj = obj[parts[0]] ? obj[parts[0]] : {};
        if (parts.length > 1) {
            nObj[parts[0]] = this._recSetup(iObj, parts.slice(1).join('/'), data);
        } else {
            nObj[parts[0]] = data;
        }
        return nObj;
    }
}

/**
 *
 * @returns {StoreManager}
 */
export const getStoreManager = () => {
    if (!window.rcStoreManager) {
        window.rcStoreManager = new StoreManager();
    }
    return window.rcStoreManager;
};
