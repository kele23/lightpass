<script setup lang="ts">
import { useTimes } from './composable/useTimes';
import { useEventListener } from '@vueuse/core';
import X401Toaster from './components/X401Toaster.vue';
import X301ModalLogin from './components/X301ModalLogin.vue';

const { addTime } = useTimes();

useEventListener('keydown', (e) => {
    if (e.key == '+' && e.altKey) {
        addTime({ time: new Date().getTime() });
    }
});
</script>

<template>
    <div>
        <router-view></router-view>
        <div id="modals"></div>
        <X301ModalLogin />
        <X401Toaster />
    </div>
</template>
