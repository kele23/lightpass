import Component from '../../libs/component';
import template from './template.hbs';
import { getDBManager } from '../../libs/db-manager';
import { dateToTime, emptyElement } from '../../libs/utils';
import { getStoreManager } from '../../libs/store-manager';

class L2Main extends Component {
    constructor() {
        super();

        this.dbManager = getDBManager();
        this.storeManager = getStoreManager();

        this._init();
        this._addStoreListeners();

        setInterval(() => {
            if (this.currentTime) this.currentTime.innerHTML = dateToTime(new Date());
        }, 1000);
    }

    _addStoreListeners() {
        this._addStoreListener('selectedPage', (path, data) => {
            const location = this._getLocation(data);
            this.dashboardContent.innerHTML = location.content;
            this.dashboardTitle.innerHTML = location.title;
        });
        this._addStoreListener('events', (path, data) => {
            if (data.ok) {
                this._ref('okConnect').classList.remove('hidden');
                this._ref('notConnect').classList.add('hidden');
            } else {
                this._ref('okConnect').classList.add('hidden');
                this._ref('notConnect').classList.remove('hidden');
            }
        });
    }

    async _init() {
        const currentPage = this.storeManager.get('selectedPage');
        const data = {
            location: this._getLocation(currentPage),
        };

        // parse html
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(template(data), 'text/html');
        this.appendChild(htmlDoc.body.firstElementChild);

        // get elements
        this.close = this._ref('closeRace');
        this.menuBtn = this._ref('menuBtn');
        this.drawerMenu = this._ref('drawerMenu');
        this.nav = this._ref('nav');
        this.dashboardContent = this._ref('dashboardContent');
        this.dashboardTitle = this._ref('dashboardTitle');
        this.currentTime = this._ref('currentTime');

        this._addListener(
            'click',
            () => {
                if (!this.drawerMenu.classList.contains('-left-64')) {
                    this.drawerMenu.classList.add('-left-64');
                } else {
                    this._emit('selectedRace', {});
                }
            },
            this.close
        );

        this._addListener(
            'click',
            () => {
                if (this.drawerMenu.classList.contains('-left-64')) {
                    this.drawerMenu.classList.remove('-left-64');
                } else {
                    this.drawerMenu.classList.add('-left-64');
                }
            },
            'menuBtn'
        );
    }

    _getLocation(currentPage) {
        if (!currentPage) return { title: 'Dashboard', content: '<m1-dashboard></m1-dashboard>' };

        if (currentPage.destination == 'race') return { title: currentPage.title, content: '<m2-race></m2-race>' };
        if (currentPage.destination == 'runner')
            return { title: currentPage.title, content: '<m3-runners></m3-runners>' };
        if (currentPage.destination == 'results')
            return { title: currentPage.title, content: '<m5-results></m5-results>' };
        if (currentPage.destination.startsWith('ps-'))
            return { title: currentPage.title, content: '<m4-score></m4-score>' };
        return { title: 'Dashboard', content: '<m1-dashboard></m1-dashboard>' };
    }
}

export default L2Main;
