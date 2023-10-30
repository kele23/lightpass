import { createRouter, createWebHistory } from 'vue-router';
import M000Racer from '../components/M000Racer.vue';
import M001Dashboard from '../components/M001Dashboard.vue';
import M002Race from '../components/M002Race.vue';
import M003Runners from '../components/M003Runners.vue';
import M004Score from '../components/M004Score.vue';
import M005GlobalScore from '../components/M005GlobalScore.vue';
import M006Device from '../components/M006Device.vue';
import M900DbView from '../components/M900DbView.vue';
import L001Main from '../components/L001Main.vue';
import { useStoreRace } from '../stores/race';
import { _t } from './dictionary';

const routes = [
    {
        path: '/',
        component: L001Main,
        children: [
            { path: '', component: M001Dashboard, meta: { title: _t('Dashboard') } },
            { path: 'race', component: M002Race, meta: { title: _t('Race') } },
            { path: 'runners', component: M003Runners, meta: { title: _t('Runners') } },
            { path: 'results', component: M005GlobalScore, meta: { title: _t('Global Results') } },
            { path: 'results/:ps', component: M004Score, meta: { title: _t('PS Results') } },
            { path: 'device', component: M006Device, meta: { title: _t('Device') } },
        ],
    },
    { path: '/entry', component: M000Racer, meta: { title: _t('Entry') } },
    { path: '/admin/db', component: M900DbView, meta: { title: _t('DB View') } },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { top: 0 };
        }
    },
});

router.beforeEach((to) => {
    if (to.path != '/entry' && !to.path.startsWith('/admin')) {
        const store = useStoreRace();
        if (!store.race) return { path: '/entry' };
    }
});

export default router;
