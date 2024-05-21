import { effect, ref } from 'vue';
import { RacesService } from '../api/services.gen.ts';
import { PartialRace, Race } from '../interfaces/db.ts';
import { useLogin } from './useLogin.ts';

const { loggedIn } = useLogin();

const races = ref<Race[]>();

const loadRaces = async () => {
    // logged -> than try to load from couch
    try {
        const resp = await RacesService.getApiRaces();
        localStorage.setItem('lightpassRaces', JSON.stringify(resp));
        races.value = resp;
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
    const addRace = async (pRace: PartialRace) => {
        try {
            const race = await RacesService.postApiRaces({ body: { name: pRace.name } });
            await loadRaces();
            return race;
        } catch (e) {
            console.warn(e);
        }
        return undefined;
    };

    return { races, addRace };
}
