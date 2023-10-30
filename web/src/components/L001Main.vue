<script setup lang="ts">
import { AtSymbolIcon, Bars3Icon, SignalIcon } from '@heroicons/vue/24/solid';
import { useBLESensor } from '../composable/useBLESensor';
import { useRace } from '../composable/useRace';
import { _t } from '../services/dictionary';
import X002Nav from './X002Nav.vue';

const { currentRace } = useRace();
const { isConnected, device, requestDevice } = useBLESensor();
</script>

<template>
    <div class="drawer xl:drawer-open">
        <input id="main-drawer" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content flex flex-col">
            <header class="sticky top-0 z-10 flex h-16 w-full items-center justify-between bg-base-200 px-4 shadow">
                <router-link to="/" class="btn-ghost btn gap-1 bg-base-300">
                    <AtSymbolIcon class="h-4 w-4" /> {{ currentRace?.name }}
                </router-link>
                <label for="main-drawer" class="btn-primary drawer-button btn-square btn xl:hidden">
                    <Bars3Icon class="h-6 w-6"
                /></label>

                <div class="flex h-full grow items-center justify-end px-3" v-if="isConnected">
                    <router-link to="/device" class="btn-ghost btn-primary btn gap-1 bg-base-300">
                        <SignalIcon class="h-6 w-6" /> {{ device?.name }}
                    </router-link>
                </div>
                <button class="btn-ghost btn-primary btn gap-1 bg-base-300" @click="requestDevice()" v-else>
                    {{ _t('Connect') }}
                </button>
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
            <X002Nav />
        </div>
    </div>
</template>
