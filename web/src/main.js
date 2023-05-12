import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { getEventService } from './services/events-service';
import router from './services/router';
import './style.css';

const pinia = createPinia();
const app = createApp(App);
app.use(router);
app.use(pinia);

// start events
getEventService().start();

// start!!!!!!
app.mount('#app');
