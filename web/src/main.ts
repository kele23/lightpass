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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Puntiamo al file sw.ts nella root del progetto (fuori da src/)
    // così lo scope di default diventa '/', senza bisogno di hack con gli header!
    const swUrl = new URL('../sw.ts', import.meta.url).href;

    // Specifichiamo type: module per i Service Worker moderni e scope /
    navigator.serviceWorker
      .register(swUrl, { type: 'module', scope: '/' })
      .then((registration) => {
        console.log('TS ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('TS ServiceWorker registration failed: ', err);
      });
  });
}
