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

/*
 * Service Worker registration
 * If the env var VITE_ENABLE_SW is set to true, the service worker will be registered
 * If the env var VITE_ENABLE_SW is set to false, the service worker will be unregistered
 * If the env var VITE_ENABLE_SW is not set, the service worker will be registered in production and unregistered in development
 */
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === 'true') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((err) => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  } else {
    // In dev mode, se non forzato, proviamo a unregister per pulire la cache di sviluppo
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('ServiceWorker unregistered (Dev Mode)');
      }
    });
  }
}
