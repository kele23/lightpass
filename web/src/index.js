import './main.css';

import C1Table from './components/c1-table';
import C2Nav from './components/c2-nav';
import L1App from './components/l1-app';
import L2Main from './components/l2-main';
import M0Racer from './components/m0-racer';
import M1Dashboard from './components/m1-dashboard';
import M2Race from './components/m2-race';
import M3Runners from './components/m3-runners';
import { getEventService } from './libs/event-service';
import M4Score from './components/m4-score';
import C3Confirm from './components/c3-confirm';
import M5Results from './components/m5-results';
import C4Penalty from './components/c4-penalty';
import C5CustomTime from './components/c5-customtime';

(async () => {
    // layout
    customElements.define('l1-app', L1App);
    customElements.define('l2-main', L2Main);
    // main components
    customElements.define('m0-racer', M0Racer);
    customElements.define('m1-dashboard', M1Dashboard);
    customElements.define('m2-race', M2Race);
    customElements.define('m3-runners', M3Runners);
    customElements.define('m4-score', M4Score);
    customElements.define('m5-results', M5Results);
    // others
    customElements.define('c1-table', C1Table);
    customElements.define('c2-nav', C2Nav);
    customElements.define('c3-confirm', C3Confirm);
    customElements.define('c4-penalty', C4Penalty);
    customElements.define('c5-customtime', C5CustomTime);

    //start event service
    getEventService().start();
})();
