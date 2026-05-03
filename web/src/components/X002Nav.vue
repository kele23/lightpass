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
  SwatchIcon,
  ChevronDownIcon,
  UserMinusIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline';
import { usePS } from '../composable/usePS.ts';
import { _t } from '../services/dictionary.ts';
import { useLightpassSensor } from '../composable/useLightpassSensor.ts';
import { useRace } from '../composable/useRace.ts';
import { useRaces } from '../composable/useRaces.ts';
import { useLogin } from '../composable/useLogin.ts';
import { UserCircleIcon } from '@heroicons/vue/24/outline';
import X300ModalConfirm from './X300ModalConfirm.vue';
import { useRouter } from 'vue-router';

/////////////////////////////////////////////////////
import { ref, watch } from 'vue';

const { pss } = usePS();
const { isConnected } = useLightpassSensor();
const { currentRace } = useRace();
const { removeRace } = useRaces();
const { user } = useLogin();
const router = useRouter();

const isConfirmOpen = ref(false);

async function confirmDeleteRace(confirmed: boolean) {
  isConfirmOpen.value = false;
  if (confirmed && currentRace.value?._id) {
    const success = await removeRace(currentRace.value._id);
    if (success) {
      router.push('/entry');
    }
  }
}

const isOnline = ref(navigator.onLine);
window.addEventListener('online', () => (isOnline.value = true));
window.addEventListener('offline', () => (isOnline.value = false));

const themes = [
  'light',
  'dark',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset',
];

const currentTheme = ref(localStorage.getItem('theme') || 'dark');

watch(
  currentTheme,
  (newTheme) => {
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    }
  },
  { immediate: true },
);

function closeDrawer() {
  const drawer = document.getElementById('main-drawer') as HTMLInputElement;
  if (drawer) drawer.checked = false;
}
</script>

<template>
  <div class="bg-base-300 text-base-content z-40 flex min-h-full w-80 flex-col p-4 shadow">
    <div class="flex items-center gap-4 pt-6">
      <RocketLaunchIcon class="h-12 w-12" />
      <p class="text-2xl font-bold">LIGHTPASS V4</p>
    </div>
    <div class="divider"></div>
    <div class="flex items-center justify-between px-4 font-semibold">
      <div class="flex items-center gap-2">
        <AtSymbolIcon class="h-6 w-6" /> {{ currentRace?.name }}
      </div>
      <button
        v-if="currentRace"
        class="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10"
        @click="isConfirmOpen = true"
        :title="_t('Delete Race')"
        data-testid="delete-race-button"
      >
        <TrashIcon class="h-5 w-5" />
      </button>
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
            <router-link to="/start" @click="closeDrawer" data-testid="nav-start"
              ><PlayIcon class="h-6 w-6 text-left" /><span class="mx-2 text-sm font-normal">
                {{ _t('Start') }}
              </span></router-link
            >
          </li>
          <li>
            <router-link to="/finish" @click="closeDrawer" data-testid="nav-finish"
              ><FlagIcon class="h-6 w-6 text-left" /><span class="mx-2 text-sm font-normal">
                {{ _t('Finish') }}
              </span></router-link
            >
          </li>
          <li>
            <router-link to="/retired" @click="closeDrawer" data-testid="nav-retired"
              ><UserMinusIcon class="h-6 w-6 text-left" /><span class="mx-2 text-sm font-normal">
                {{ _t('Retired') }}
              </span></router-link
            >
          </li>
        </ul>
      </li>
      <li>
        <router-link to="/results" @click="closeDrawer" data-testid="nav-results">
          <CheckBadgeIcon class="h-6 w-6 text-left" />
          <span class="mx-2 text-sm font-normal"> {{ _t('Global Results') }} </span>
        </router-link>
      </li>
      <li v-if="pss.length > 0">
        <router-link v-for="item in pss" :key="item._id" :to="'/results/' + item._id" @click="closeDrawer">
          <LifebuoyIcon class="h-6 w-6 text-left" />
          <span class="mx-2 text-sm font-normal"> {{ item.name }} </span>
        </router-link>
      </li>
      <li>
        <router-link to="/runners" @click="closeDrawer" data-testid="nav-runners">
          <UsersIcon class="h-6 w-6 text-left" />
          <span class="mx-2 text-sm font-normal"> {{ _t('Runners') }} </span>
        </router-link>
      </li>
      <li>
        <router-link to="/race" @click="closeDrawer" data-testid="nav-race">
          <CubeIcon class="h-6 w-6 text-left" />
          <span class="mx-2 text-sm font-normal"> {{ _t('Race') }} </span>
        </router-link>
      </li>
      <li v-if="isConnected">
        <router-link to="/device" @click="closeDrawer" data-testid="nav-device">
          <SignalIcon class="h-6 w-6 text-left" />
          <span class="mx-2 text-sm font-normal"> {{ _t('Device') }} </span>
        </router-link>
      </li>
    </ul>
    <div class="divider"></div>
    <div class="px-4">
      <div class="dropdown dropdown-top w-full" data-testid="theme-selector">
        <label
          tabindex="0"
          role="button"
          class="btn btn-ghost btn-block hover:bg-base-content/5 justify-between px-2 font-normal"
        >
          <div class="flex items-center gap-2">
            <SwatchIcon class="h-6 w-6" />
            <span class="text-sm font-medium">{{ _t('Theme') }}</span>
          </div>
          <ChevronDownIcon class="h-4 w-4 opacity-50" />
        </label>
        <ul
          tabindex="0"
          class="dropdown-content bg-base-300 rounded-box border-base-content/10 z-50 mb-2 max-h-80 w-full overflow-y-auto border p-2 shadow-2xl"
        >
          <li v-for="t in themes" :key="t">
            <input
              type="radio"
              name="theme-dropdown"
              class="theme-controller btn btn-sm btn-block btn-ghost justify-start font-normal capitalize"
              :aria-label="t"
              :value="t"
              v-model="currentTheme"
              @click="($event.target as HTMLInputElement).blur()"
            />
          </li>
        </ul>
      </div>
    </div>
    <div class="divider"></div>
    <div class="flex justify-between px-4">
      <router-link to="/entry" class="btn btn-warning" @click="closeDrawer" data-testid="nav-back">
        <ArrowLeftStartOnRectangleIcon class="h-6 w-6 text-left" />
        <span class="mx-2 text-sm font-semibold"> {{ _t('Back') }} </span>
      </router-link>
      <div class="flex items-center gap-2" v-if="user">
        <div
          :class="['h-3 w-3 rounded-full', isOnline ? 'bg-success' : 'bg-error']"
          :title="isOnline ? _t('Online') : _t('Offline')"
        ></div>
        <UserCircleIcon class="h-6 w-6" />
        <b class="text-base">{{ user?.name }}</b>
      </div>
    </div>
    <X300ModalConfirm
      :is-revealed="isConfirmOpen"
      :title="_t('Delete Race')"
      :description="_t('Are you sure you want to delete this race? This action cannot be undone.')"
      @close="confirmDeleteRace"
    />
  </div>
</template>
