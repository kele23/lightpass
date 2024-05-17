import PouchDB from 'pouchdb';
import { effect, ref, shallowRef } from 'vue';
import { IDItem, PS, PartialRace, Race, Runner, Take, Time } from '../interfaces/db.ts';
import { loggedIn, refreshToken } from './useLogin.ts';
import { RacesService } from '../api/services.gen.ts';

export const races = ref<Race[]>();

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

export const currentRace = ref<Race>();
export const raceDB = shallowRef<PouchDB.Database<IDItem | PS | Runner | Take | Time>>();
export const remoteDB = shallowRef<PouchDB.Database<IDItem | PS | Runner | Take | Time>>();
let syncHandler: PouchDB.Replication.Sync<IDItem | PS | Runner | Take | Time> | null = null;

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

const setCurrentRace = async (race: Race) => {
    // stop sync if running
    if (syncHandler) {
        syncHandler.cancel();
    }

    // close current DBs
    if (raceDB.value) {
        raceDB.value.close();
        raceDB.value = undefined;
    }

    if (remoteDB.value) {
        remoteDB.value.close();
        remoteDB.value = undefined;
    }

    // create new raceDB
    raceDB.value = new PouchDB<IDItem | PS | Runner | Take>(race._id);

    // enable sync to remote DB
    if (loggedIn.value) {
        remoteDB.value = new PouchDB<IDItem | PS | Runner | Take>(`${window.location.origin}/couchdb/${race._id}`, {
            fetch: async (url, opts) => {
                const response = await PouchDB.fetch(url, opts);
                if (response.status == 401) {
                    const refreshed = await refreshToken();
                    if (refreshed) {
                        return await PouchDB.fetch(url, opts);
                    }
                }
                return response;
            },
        });
        syncHandler = raceDB.value.sync(remoteDB.value, {
            live: true,
            retry: true,
        });
    }

    currentRace.value = race;
};

export function useRace() {
    return { races, currentRace, addRace, setCurrentRace };
}
