<script setup>
import { getDBManager } from '../services/db-manager';
import { BeakerIcon, CheckBadgeIcon, CogIcon, CubeIcon, LifebuoyIcon, UsersIcon } from '@heroicons/vue/24/solid';
import { useRoute } from 'vue-router';

/////////////////////////////////////////////////////
const dbManager = getDBManager();

const route = useRoute();
const raceId = route.params.race;

const race = await dbManager.getRace(raceId);
const pss = await dbManager.getAllPSs(raceId);

/////////////////////////////////////////////////////
</script>

<template>
    <div class="ml-8 pt-6">
        <p class="text-2xl font-bold dark:text-white">LIGHTPASS V3</p>
        <p>{{ race.name }}</p>
    </div>
    <nav class="mt-6">
        <div>
            <router-link
                class="my-2 flex w-full items-center justify-start border-l-4 border-transparent p-2 pl-6 text-gray-400 transition-colors duration-200 hover:text-gray-800 active:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:active:text-white"
                :to="'/' + raceId"
            >
                <CogIcon class="h-6 w-6 text-left" />
                <span class="mx-2 text-sm font-normal"> Dashboard </span>
            </router-link>
            <router-link
                class="my-2 flex w-full items-center justify-start border-l-4 border-transparent p-2 pl-6 text-gray-400 transition-colors duration-200 hover:text-gray-800 active:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:active:text-white"
                :to="'/' + raceId + '/results'"
            >
                <CheckBadgeIcon class="h-6 w-6 text-left" />
                <span class="mx-2 text-sm font-normal"> Risultati </span>
            </router-link>
            <router-link
                v-for="item in pss"
                :key="item._id"
                class="my-2 flex w-full items-center justify-start border-l-4 border-transparent p-2 pl-6 text-gray-400 transition-colors duration-200 hover:text-gray-800 active:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:active:text-white"
                :to="'/' + raceId + '/results/' + item._id"
            >
                <LifebuoyIcon class="h-6 w-6 text-left" />
                <span class="mx-2 text-sm font-normal">
                    {{ item.name }}
                </span>
            </router-link>
            <router-link
                class="my-2 flex w-full items-center justify-start border-l-4 border-transparent p-2 pl-6 text-gray-400 transition-colors duration-200 hover:text-gray-800 active:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:active:text-white"
                :to="'/' + raceId + '/runners'"
            >
                <UsersIcon class="h-6 w-6 text-left" />
                <span class="mx-2 text-sm font-normal"> Corridori </span>
            </router-link>
            <router-link
                class="my-2 flex w-full items-center justify-start border-l-4 border-transparent p-2 pl-6 text-gray-400 transition-colors duration-200 hover:text-gray-800 active:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:active:text-white"
                :to="'/' + raceId + '/ps'"
            >
                <CubeIcon class="h-6 w-6 text-left" />
                <span class="mx-2 text-sm font-normal"> Gara </span>
            </router-link>
        </div>
    </nav>
</template>
