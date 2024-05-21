<script setup lang="ts">
import {
    ArrowLeftStartOnRectangleIcon,
    AtSymbolIcon,
    CheckBadgeIcon,
    CogIcon,
    CubeIcon,
    FlagIcon,
    LifebuoyIcon,
    PlayIcon,
    RocketLaunchIcon,
    SignalIcon,
    UsersIcon,
} from '@heroicons/vue/24/outline';
import { usePS } from '../composable/usePS.ts';
import { _t } from '../services/dictionary.ts';
import { useLightpassSensor } from '../composable/useLightpassSensor.ts';
import { useRace } from '../composable/useRace.ts';
import { useLogin } from '../composable/useLogin.ts';
import { UserCircleIcon } from '@heroicons/vue/24/outline';

/////////////////////////////////////////////////////
const { pss } = usePS();
const { isConnected } = useLightpassSensor();
const { currentRace } = useRace();
const { user } = useLogin();
</script>

<template>
    <div class="z-40 flex min-h-full w-80 flex-col bg-base-300 p-4 text-base-content shadow">
        <div class="flex items-center gap-4 pt-6">
            <RocketLaunchIcon class="h-12 w-12" />
            <p class="text-2xl font-bold">LIGHTPASS V4</p>
        </div>
        <div class="divider"></div>
        <div class="flex items-center gap-2 px-4 font-semibold">
            <AtSymbolIcon class="h-6 w-6" /> {{ currentRace?.name }}
        </div>
        <div class="divider"></div>
        <ul class="menu mt-6 grow p-0 [&_li>*]:rounded-none">
            <li>
                <span>
                    <CogIcon class="h-6 w-6 text-left" />
                    <span class="mx-2 text-sm font-normal"> {{ _t('Dashboard') }} </span>
                </span>
                <ul>
                    <li>
                        <router-link to="/start"
                            ><PlayIcon class="h-6 w-6 text-left" /><span class="mx-2 text-sm font-normal">
                                {{ _t('Start') }}
                            </span></router-link
                        >
                    </li>
                    <li>
                        <router-link to="/finish"
                            ><FlagIcon class="h-6 w-6 text-left" /><span class="mx-2 text-sm font-normal">
                                {{ _t('Finish') }}
                            </span></router-link
                        >
                    </li>
                </ul>
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
        <div class="divider"></div>
        <div class="flex justify-between px-4">
            <router-link to="/entry" class="btn btn-warning">
                <ArrowLeftStartOnRectangleIcon class="h-6 w-6 text-left" />
                <span class="mx-2 text-sm font-semibold"> {{ _t('Back') }} </span>
            </router-link>
            <div class="flex items-center gap-2" v-if="user">
                <UserCircleIcon class="h-6 w-6" />
                <b class="text-lg">{{ user?.name }}</b>
            </div>
        </div>
    </div>
</template>
