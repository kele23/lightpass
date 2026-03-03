import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import router from './services/router.ts';
import './style.css';

const pinia = createPinia();

const app = createApp(App);
app.use(router);
app.use(pinia);

// start!!!!!!
app.mount('#app');
