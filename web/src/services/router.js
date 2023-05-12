import { createRouter, createWebHashHistory } from 'vue-router';
import L0Racer from '../components/L0Racer.vue';
import L1Main from '../components/L1Main.vue';
import M1Dashboard from '../components/M1Dashboard.vue';
import M2Ps from '../components/M2Ps.vue';
import M3Runners from '../components/M3Runners.vue';
import M4Score from '../components/M4Score.vue';

const routes = [
    { path: '/', component: L0Racer },
    {
        path: '/:race',
        component: L1Main,
        meta: {
            checkRace: true,
        },
        children: [
            { path: '', component: M1Dashboard, meta: { title: 'Dashboard' } },
            { path: 'ps', component: M2Ps, meta: { title: 'PS' } },
            { path: 'runners', component: M3Runners, meta: { title: 'Runners' } },
            { path: 'results', component: M3Runners, meta: { title: 'Results' } },
            { path: 'results/:ps', component: M4Score, meta: { title: 'PS Results' } },
        ],
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
