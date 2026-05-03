import { effect, ref } from 'vue';
import { apiFetch } from '../utils/apiFetch.ts';
import { useLogin } from './useLogin.ts';
import { Race } from '../../types/races.ts';

const { loggedIn } = useLogin();

const races = ref<Race[]>([]);

const loadRaces = async () => {
  try {
    const resp = await apiFetch('/api/races/list', { cacheKey: 'lightpassRaces' });

    // Se il server (o apiFetch post-refresh) risponde con 401 Unauthorized, ci fermiamo
    if (resp.status === 401) {
      races.value = [];
      return;
    }

    if (!resp.ok) {
      throw new Error(`Server err: ${resp.status}`);
    }

    races.value = (await resp.json()) as Race[];
  } catch (e) {
    console.warn('Errore fatale: impossibile caricare gare, cache vuota o offline completo', e);
  }
};

effect(async () => {
  // Se non si è loggati (né online né con il fallback offline), svuotiamo la lista visualizzata
  // ed evitiamo di ripescarla forzatamente dalla cache (l'utente la vedrà solo DOPO o DURANTE il login).
  if (!loggedIn.value) {
    races.value = [];
    return;
  }

  await loadRaces();
});

export function useRaces() {
  const addRace = async (pRace: { name: string }) => {
    try {
      const resp = await fetch('/api/races', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pRace),
      });
      const race = (await resp.json()) as Race;
      await loadRaces();
      return race;
    } catch (e) {
      console.warn(e);
    }
    return undefined;
  };

  const removeRace = async (id: string) => {
    try {
      const resp = await fetch(`/api/races/${id}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        await loadRaces();
        return true;
      }
    } catch (e) {
      console.warn(e);
    }
    return false;
  };

  return { races, addRace, removeRace };
}
