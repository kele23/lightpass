<script setup lang="ts">
import { useTimes } from './composable/useTimes';
import { useEventListener } from '@vueuse/core';
import X401Toaster from './components/X401Toaster.vue';
import { getMachineId } from './services/utils';

const { addTime } = useTimes();

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
