import { createRouter, createWebHistory } from 'vue-router';
import M000Racer from '../components/M000Racer.vue';
import M001Dashboard from '../components/M001Dashboard.vue';
import M002Race from '../components/M002Race.vue';
import M003Runners from '../components/M003Runners.vue';
import M004Score from '../components/M004Score.vue';
import M005GlobalScore from '../components/M005GlobalScore.vue';
import M006Device from '../components/M006Device.vue';
import M901NotFound from '../components/M901NotFound.vue';
import M902Login from '../components/M902Login.vue';
import L001Main from '../components/L001Main.vue';
import { _t } from './dictionary.ts';
import { useRace } from '../composable/useRace.ts';
import { useLogin } from '../composable/useLogin.ts';
import { TakeType } from '../interfaces/db.ts';

const routes = [
    { path: '/:pathMatch(.*)*', component: M901NotFound, meta: { title: _t('Not Found') } },
    {
        path: '/',
        component: L001Main,
        children: [
            { path: 'start', component: M001Dashboard, meta: { title: _t('Start'), type: TakeType.start } },
            { path: 'finish', component: M001Dashboard, meta: { title: _t('Finish'), type: TakeType.end } },
            { path: 'race', component: M002Race, meta: { title: _t('Race') } },
            { path: 'runners', component: M003Runners, meta: { title: _t('Runners') } },
            { path: 'results', component: M005GlobalScore, meta: { title: _t('Global Results') } },
            { path: 'results/:ps', component: M004Score, meta: { title: _t('PS Results') } },
            { path: 'device', component: M006Device, meta: { title: _t('Device') } },
        ],
        meta: {
            race: true,
        },
    },
    { path: '/entry', component: M000Racer, meta: { title: _t('Entry') } },
    { path: '/login', component: M902Login, meta: { title: _t('Login') } },
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
    if (to.meta.race) {
        const { currentRace } = useRace();
        if (!currentRace.value) return { path: '/entry' };
    }
});

export default router;
