import { defineStore } from 'pinia';

export const currentRaceStore = defineStore('currentRace', {
    state: () => {
        return { id: null };
    },

    actions: {
        setCurrentRace(id) {
            this.id = id;
        },
        resetRace() {
            this.id = null;
        },
    },
});

export const connectionStore = defineStore('connection', {
    state: () => {
        return { connected: false };
    },

    actions: {
        setConnected(connected) {
            this.connected = connected;
        },
    },
});
