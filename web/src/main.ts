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
    // Carichiamo il nostro Service Worker Javascript (che Vite/Nitro servono dalla cartella public/)
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
