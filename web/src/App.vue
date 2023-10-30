<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import X401Toaster from './components/X401Toaster.vue';
import { addTime } from './services/db';



useEventListener('keydown', (e) => {
    if (e.key == '+' && e.altKey) {
        addTime(new Date().getTime());
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
