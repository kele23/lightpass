<script setup lang="ts">
import { useLightpassSensor } from '../composable/useLightpassSensor.ts';
import { useRace } from '../composable/useRace.ts';
import X002Nav from './X002Nav.vue';
import { SignalIcon, AtSymbolIcon, Bars3Icon } from '@heroicons/vue/24/outline';
import { ref, onMounted, onUnmounted } from 'vue';
import { format } from 'date-fns';

const { currentRace } = useRace();
const { isConnected, requestDevice } = useLightpassSensor();

const currentTime = ref<string>(format(new Date(), 'HH:mm:ss'));

let interval = undefined;
onMounted(() => {
    interval = setInterval(() => {
        currentTime.value = format(new Date(), 'HH:mm:ss');
    }, 1000);
});

onUnmounted(() => {
    if (interval) clearInterval(interval);
});
</script>

<template>
    <div class="drawer xl:drawer-open">
        <input id="main-drawer" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content flex flex-col">
            <header
                class="sticky top-0 z-10 flex h-16 w-full items-center justify-between bg-base-200 px-4 shadow xl:justify-end"
            >
                <label for="main-drawer" class="btn-empty btn btn-square drawer-button xl:hidden">
                    <Bars3Icon class="h-6 w-6"
                /></label>

                <div class="flex items-center gap-2">
                    <span>{{ currentTime }}</span>
                    <button
                        class="btn"
                        v-bind:class="isConnected ? 'btn-primary' : 'btn-ghost'"
                        @click="requestDevice()"
                    >
                        <SignalIcon class="h-6 w-6" />
                    </button>
                </div>
            </header>
            <div class="px-4 py-4 pb-24">
                <div class="relative">
                    <router-view v-slot="{ Component }">
                        <transition
                            enter-active-class="duration-300 ease-out"
                            enter-from-class="opacity-0"
                            enter-to-class="opacity-100"
                            leave-active-class="duration-300 ease-in absolute left-0 right-0"
                            leave-from-class="opacity-100"
                            leave-to-class="opacity-0"
                        >
                            <component :is="Component" />
                        </transition>
                    </router-view>
                </div>
            </div>
        </div>
        <div class="drawer-side z-20">
            <label for="main-drawer" class="drawer-overlay"></label>
            <X002Nav class="" />
        </div>
    </div>
</template>
