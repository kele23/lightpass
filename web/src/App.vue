<script setup>
import { currentRaceStore, connectionStore } from './stores/current-race';
import { ref } from 'vue';
import { getDBManager } from './services/db-manager';
import { BeakerIcon } from '@heroicons/vue/24/solid';

///////////
const db = getDBManager();

// startup
let initialized = ref(false);
db.initialize().then(() => {
    setTimeout(() => {
        initialized.value = true;
    }, 2000);
});
</script>

<template>
    <!-- LOADING -->
    <div v-if="!initialized" role="status" class="flex w-full h-screen justify-center items-center">
        <BeakerIcon class="h-6 w-6" />
        <span class="sr-only">Loading...</span>
    </div>
    <div v-if="initialized">
        <Suspense>
            <router-view></router-view>
        </Suspense>
    </div>
</template>
