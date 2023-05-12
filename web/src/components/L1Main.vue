<script setup>
import { connectionStore } from '../stores/current-race';
import { BeakerIcon } from '@heroicons/vue/24/solid';
import C2Nav from './C2Nav.vue';
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';

///////////
const connection = connectionStore();

const route = useRoute();
const title = ref(route.meta.title);

// fetch the user information when params change
watch(
    () => route.meta.title,
    (newTitle) => {
        title.value = newTitle;
    }
);
</script>

<template>
    <main class="relative h-screen overflow-hidden bg-gray-100 dark:bg-gray-800">
        <div class="flex items-start justify-between">
            <div
                class="absolute -left-64 z-50 h-screen w-64 shrink-0 shadow-lg transition-all lg:relative lg:left-0 lg:block"
            >
                <div class="h-full bg-white dark:bg-gray-700">
                    <Suspense><C2Nav /></Suspense>
                </div>
            </div>
            <div class="flex w-full flex-col space-y-2 md:space-y-4">
                <header class="z-40 flex h-16 w-full items-center justify-between shadow-md">
                    <div class="flex h-full flex-col justify-center px-3 lg:hidden">
                        <div class="relative flex w-full items-center justify-end space-x-4 p-1">
                            <button class="text-md flex items-center rounded-full bg-white p-2 text-gray-500 shadow">
                                <BeakerIcon class="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div class="relative z-20 flex h-full flex-col justify-center px-3 md:w-full">
                        <div class="relative flex w-full items-center justify-end space-x-4 p-1">
                            <div class="text-gray-700 dark:text-gray-100"></div>
                            <div>
                                <div v-show="connection.connected">
                                    <BeakerIcon class="h-6 w-6" />
                                    <span class="hidden text-sm font-medium lg:inline">Connesso</span>
                                </div>
                                <div v-show="!connection.connected">
                                    <BeakerIcon class="h-6 w-6" />
                                    <span class="hidden text-sm font-medium lg:inline"> Non connesso </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <div class="h-screen overflow-auto px-4 pb-24 md:px-6">
                    <h1 class="mb-4 text-4xl font-semibold text-gray-800 dark:text-white">{{ title }}</h1>
                    <div>
                        <router-view></router-view>
                    </div>
                </div>
            </div>
        </div>
        <!--<c3-confirm></c3-confirm>-->
        <!--<c4-penalty name="default"></c4-penalty>
        <c5-customtime name="default"></c5-customtime>-->
    </main>
</template>
