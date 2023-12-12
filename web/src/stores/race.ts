import { defineStore } from 'pinia';
import { Race } from '../interfaces/db.ts';

export type RaceStoreState = {
    race?: Race;
    setCurrentRace(newRace?: Race): void;
};

export const useStoreRace = defineStore('race', {
    state: () => {
        return {
            race: undefined,
        } as RaceStoreState;
    },

    actions: {
        setCurrentRace(newRace: Race): void {
            this.race = newRace;
        },
    },

    persist: true,
});
