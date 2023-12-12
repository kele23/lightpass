<script setup lang="ts">
import {
    CheckBadgeIcon,
    CogIcon,
    CubeIcon,
    LifebuoyIcon,
    RocketLaunchIcon,
    SignalIcon,
    UsersIcon,
} from '@heroicons/vue/24/solid';
import { usePS } from '../composable/usePS.ts';
import { useRace } from '../composable/useRace.ts';
import { _t } from '../services/dictionary.ts';
import { useLightpassSensor } from '../composable/useLightpassSensor.ts';

/////////////////////////////////////////////////////
const { pss } = usePS();
const { races, currentRace, setCurrentRace } = useRace();
const { isConnected } = useLightpassSensor();
</script>

<template>
    <div class="z-40 min-h-full w-80 bg-base-300 p-4 text-base-content shadow">
        <div class="flex items-center gap-4 pt-6">
            <RocketLaunchIcon class="h-12 w-12" />
            <p class="text-2xl font-bold">LIGHTPASS V4</p>
        </div>
        <div class="w-full max-w-xs pt-10 pb-3">
            <div class="flex justify-between pb-1">
                <span class="label-text">{{ _t('Current race:') }}</span>
                <router-link to="/entry" class="btn-link label-text-alt btn-xs btn px-0">
                    {{ _t('New Race') }}
                </router-link>
            </div>
            <select
                class="select w-full max-w-xs"
                @change="setCurrentRace(($event.target as HTMLSelectElement)?.value)"
            >
                <option
                    v-for="item in races"
                    :key="item._id"
                    :value="item._id"
                    :selected="item._id == currentRace?._id"
                >
                    {{ item.name }}
                </option>
            </select>
        </div>
        <div class="divider"></div>
        <ul class="menu mt-6 p-0 [&_li>*]:rounded-none">
            <li>
                <router-link to="/">
                    <CogIcon class="h-6 w-6 text-left" />
                    <span class="mx-2 text-sm font-normal"> {{ _t('Dashboard') }} </span>
                </router-link>
            </li>
            <li>
                <router-link to="/results">
                    <CheckBadgeIcon class="h-6 w-6 text-left" />
                    <span class="mx-2 text-sm font-normal"> {{ _t('Global Results') }} </span>
                </router-link>
            </li>
            <li v-if="pss.length > 0">
                <router-link v-for="item in pss" :key="item._id" :to="'/results/' + item._id">
                    <LifebuoyIcon class="h-6 w-6 text-left" />
                    <span class="mx-2 text-sm font-normal"> {{ item.name }} </span>
                </router-link>
            </li>
            <li>
                <router-link to="/runners">
                    <UsersIcon class="h-6 w-6 text-left" />
                    <span class="mx-2 text-sm font-normal"> {{ _t('Runners') }} </span>
                </router-link>
            </li>
            <li>
                <router-link to="/race">
                    <CubeIcon class="h-6 w-6 text-left" />
                    <span class="mx-2 text-sm font-normal"> {{ _t('Race') }} </span>
                </router-link>
            </li>
            <li v-if="isConnected">
                <router-link to="/device">
                    <SignalIcon class="h-6 w-6 text-left" />
                    <span class="mx-2 text-sm font-normal"> {{ _t('Device') }} </span>
                </router-link>
            </li>
        </ul>
    </div>
</template>
../composable/useLightpassSensor
