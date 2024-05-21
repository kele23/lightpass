import PouchDB from 'pouchdb';
import { ref, shallowRef } from 'vue';
import { IDItem, PS, Race, Runner, Take, Time } from '../interfaces/db.ts';
import { useLogin } from './useLogin.ts';

const { loggedIn, refreshToken } = useLogin();

const currentRace = ref<Race>();
const raceDB = shallowRef<PouchDB.Database<IDItem | PS | Runner | Take | Time>>();
const remoteDB = shallowRef<PouchDB.Database<IDItem | PS | Runner | Take | Time>>();
let syncHandler: PouchDB.Replication.Sync<IDItem | PS | Runner | Take | Time> | null = null;

export function useRace() {
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

    return { raceDB, currentRace, setCurrentRace };
}
