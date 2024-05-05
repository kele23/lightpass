<script setup lang="ts">
import { AtSymbolIcon, Bars3Icon, SignalIcon, UserIcon } from '@heroicons/vue/24/solid';
import { useLightpassSensor } from '../composable/useLightpassSensor.ts';
import { useRace } from '../composable/useRace.ts';
import X002Nav from './X002Nav.vue';
import { format } from 'date-fns';

const { currentRace } = useRace();
const { isConnected, requestDevice } = useLightpassSensor();
</script>

<template>
    <div class="drawer xl:drawer-open">
        <input id="main-drawer" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content flex flex-col">
            <header class="sticky top-0 z-10 flex h-16 w-full items-center justify-between bg-base-200 px-4 shadow">
                <router-link to="/" class="btn btn-ghost gap-1 bg-base-300">
                    <AtSymbolIcon class="h-4 w-4" /> {{ currentRace?.name }}
                </router-link>
                <label for="main-drawer" class="btn btn-square btn-primary drawer-button xl:hidden">
                    <Bars3Icon class="h-6 w-6"
                /></label>

                <!-- <div class="flex gap-2">
                    <button v-if="lastSync">{{ format(lastSync, 'HH:mm:ss') }}</button>
                    <button
                        class="btn btn-primary btn-ghost gap-1 bg-base-300"
                        :disabled="loading"
                        @click="loginPopup = !loginPopup"
                    >
                        <UserIcon class="h-6 w-6" v-bind:class="isLogged && 'text-primary'" v-if="!loading" />
                        <span class="loading loading-spinner loading-sm" v-if="loading"></span>
                    </button>
                    <button class="btn btn-primary btn-ghost gap-1 bg-base-300" @click="requestDevice()">
                        <SignalIcon class="h-6 w-6" v-bind:class="isConnected && 'text-primary'" />
                    </button>
                </div> -->
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
