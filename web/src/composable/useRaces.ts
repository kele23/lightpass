import { effect, ref } from 'vue';
import { useLogin } from './useLogin.ts';
import { Race } from '../../types/races.ts';

const { loggedIn } = useLogin();

const races = ref<Race[]>([]);

const loadRaces = async () => {
  // logged -> than try to load from couch
  try {
    const resp = await fetch('/api/races/list');
    const racesX = (await resp.json()) as Race[];
    localStorage.setItem('lightpassRaces', JSON.stringify(resp));
    races.value = racesX;
  } catch (e) {
    console.warn(e);

    // fallback to local storage
    const tmpRaces = localStorage.getItem('lightpassRaces');
    if (tmpRaces) {
      races.value = JSON.parse(tmpRaces) as Race[];
    }
  }
};

effect(async () => {
  // not logged? then load from local storage
  if (!loggedIn.value) {
    const tmpRaces = localStorage.getItem('lightpassRaces');
    if (tmpRaces) {
      races.value = JSON.parse(tmpRaces) as Race[];
    }
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

  return { races, addRace };
}
