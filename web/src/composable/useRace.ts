import PouchDB from 'pouchdb-browser';
import { ref, shallowRef, watch } from 'vue';
import { PS, Runner, Take, Time } from '../interfaces/db.ts';
import { useLogin } from './useLogin.ts';
import { doRefreshToken, apiLogout } from '../utils/apiFetch.ts';
import { Race } from '../../types/races.ts';
import { IDItem } from '../../types/iditem.ts';

const { loggedIn, isReadOnly } = useLogin();

const currentRace = ref<Race>();
const raceDB = shallowRef<PouchDB.Database<IDItem | PS | Runner | Take | Time>>();
const remoteDB = shallowRef<PouchDB.Database<IDItem | PS | Runner | Take | Time>>();
let syncHandler: PouchDB.Replication.Sync<IDItem | PS | Runner | Take | Time> | PouchDB.Replication.Replication<IDItem | PS | Runner | Take | Time> | null = null;

const isOnline = ref(navigator.onLine);
window.addEventListener('online', () => (isOnline.value = true));
window.addEventListener('offline', () => (isOnline.value = false));

// Gestiamo la sincronizzazione in modo reattivo: si avvia o si ferma automaticamente
// se l'utente fa login/logout, cambia gara, o semplicemente va offline/online.
watch([loggedIn, currentRace, raceDB, isOnline], ([isLogged, race, localDb, online]) => {
  // Ferma eventuali sync in corso
  if (syncHandler) {
    syncHandler.cancel();
    syncHandler = null;
  }
  if (remoteDB.value) {
    remoteDB.value.close();
    remoteDB.value = undefined;
  }

  // Se siamo loggati, CONNESSI, e abbiamo DB e gara validi, avviamo il sync remoto!
  if (isLogged && online && race && localDb) {
    remoteDB.value = new PouchDB<IDItem | PS | Runner | Take>(`${window.location.origin}/couch/${race._id}`, {
      fetch: async (url, opts) => {
        const response = await PouchDB.fetch(url, opts);
        if (response.status == 401) {
          const refreshed = await doRefreshToken();
          if (refreshed) {
            return await PouchDB.fetch(url, opts);
          } else {
            apiLogout(); // Slogga
          }
        }
        return response;
      },
    });

    if (isReadOnly.value) {
      // Per il ruolo viewer, facciamo solo REPLICA da remoto (PULL ONLY)
      syncHandler = localDb.replicate.from(remoteDB.value, {
        live: true,
        retry: true,
      });
    } else {
      // Per ruoli normali/admin, facciamo SYNC bidirezionale
      syncHandler = localDb.sync(remoteDB.value, {
        live: true,
        retry: true,
      });
    }
  }
});

export function useRace() {
  const setCurrentRace = async (race: Race) => {
    // Chiudiamo solo il DB locale (il watcher penserà a cancellare il sync e il DB remoto)
    if (raceDB.value) {
      raceDB.value.close();
    }

    // Creiamo il nuovo DB locale
    raceDB.value = new PouchDB<IDItem | PS | Runner | Take>(race._id);
    currentRace.value = race;
  };

  return { raceDB, currentRace, setCurrentRace };
}
