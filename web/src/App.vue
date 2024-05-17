<script setup lang="ts">
import { useTimes } from './composable/useTimes';
import { useEventListener } from '@vueuse/core';
import X401Toaster from './components/X401Toaster.vue';
import { getMachineId } from './services/utils';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { addTime } = useTimes();

const intervalMS = 60 * 60 * 1000;
const updateServiceWorker = useRegisterSW({
    onRegistered(r) {
        r &&
            setInterval(() => {
                r.update();
            }, intervalMS);
    },
});

useEventListener('keydown', (e) => {
    if (e.key == '+' && e.altKey) {
        addTime({ time: new Date().getTime(), deviceId: getMachineId() });
    }
});
</script>

<template>
    <div>
        <router-view></router-view>
        <div id="modals"></div>
        <X401Toaster />
    </div>
</template>
