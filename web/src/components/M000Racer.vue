<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useRace } from '../composable/useRace.ts';
import { _t } from '../services/dictionary.ts';
import { useLogin } from '../composable/useLogin.ts';
import { useRaces } from '../composable/useRaces.ts';
import { UserCircleIcon, RocketLaunchIcon, LifebuoyIcon } from '@heroicons/vue/24/outline';
import { hardResetApp } from '../utils/apiFetch.ts';

/////////////////////////////////////////////////////
const { races, addRace } = useRaces();
const { setCurrentRace } = useRace();
const { loggedIn, user, logout } = useLogin();
const router = useRouter();

/////////////////////////////////////////////////////
async function createRace(event: Event) {
  const formData = new FormData(event.target as HTMLFormElement);
  const raceName = formData.get('name') as string;
  const doc = await addRace({ name: raceName });
  if (doc) {
    await setCurrentRace(doc);
    router.push('/race');
  }
}

async function selectRace(event: Event) {
  const formData = new FormData(event.target as HTMLFormElement);
  const id = formData.get('name');
  if (races.value) {
    const race = races.value.find((item) => item._id == id);
    if (race) {
      await setCurrentRace(race);
      router.push('/race');
    }
  }
}
</script>

<template>
  <div class="container mx-auto">
    <div class="flex w-full flex-wrap">
      <div class="flex w-full flex-col items-center justify-center py-11 md:w-1/2">
        <div class="mb-14 flex items-center gap-4 rounded-xl bg-slate-900 p-6 text-white">
          <RocketLaunchIcon class="h-12 w-12" />
          <p class="text-2xl font-bold">LIGHTPASS V4</p>
        </div>
        <div class="mb-4 flex items-center gap-6" v-if="!loggedIn">
          <router-link to="/login" class="btn btn-ghost" data-testid="login-link">
            <UserCircleIcon class="h-5 w-5" /> {{ _t('Login') }}
          </router-link>
        </div>
        <div class="mb-4 flex items-center gap-6" v-if="loggedIn">
          <div class="flex items-center gap-2">
            <UserCircleIcon class="h-6 w-6" />
            <span class="text-xl"
              >{{ _t('Hi') }} <b class="text-2xl">{{ user?.name }}!</b>
            </span>
          </div>
          <div>
            <button class="btn btn-warning btn-sm" type="button" @click="() => logout()" data-testid="logout-button">
              {{ _t('Logout') }}
            </button>
          </div>
        </div>
        <div class="flex items-center justify-center">
          <hr class="w-32" />
        </div>
        <div class="my-4 flex w-full max-w-xs flex-col justify-center px-8 pt-8 md:pt-0">
          <p class="text-center text-3xl" data-testid="select-race-title">{{ _t('Select a race') }}</p>
          <form class="flex flex-col pt-3" @submit.prevent="selectRace" data-testid="select-race-form">
            <div class="flex flex-col pt-4 pb-4">
              <div class="relative flex">
                <select class="select select-bordered w-full max-w-xs" name="name" data-testid="select-race-input">
                  <option value="">{{ _t('Select a race') }}</option>

                  <option v-for="item in races" :key="item._id" :value="item._id">
                    {{ item.name }}
                  </option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn" data-testid="select-race-submit">
              <span class="w-full"> {{ _t('Continue') }} </span>
            </button>
          </form>
        </div>
        <div class="flex items-center justify-center">
          <hr class="w-16" />
          <div class="px-5">{{ _t('or') }}</div>
          <hr class="w-16" />
        </div>
        <div
          class="my-4 flex w-full max-w-xs flex-col justify-center px-8 pt-8 md:pt-0"
          :class="!loggedIn ? 'pointer-events-none opacity-30' : ''"
          data-testid="new-race-container"
        >
          <p class="text-center text-3xl">{{ _t('New race') }}</p>
          <form class="flex flex-col pt-3" @submit.prevent="createRace" data-testid="new-race-form">
            <div class="flex flex-col pt-4 pb-4">
              <div class="relative flex">
                <input
                  type="text"
                  class="input input-bordered w-full max-w-xs"
                  name="name"
                  data-testid="new-race-name"
                  placeholder="es: E Ben Sa Ghe 2023"
                />
              </div>
            </div>
            <button class="btn" type="submit" data-testid="new-race-submit">
              <span class="w-full"> {{ _t('Create') }} </span>
            </button>
          </form>
        </div>
        <div class="mt-12 flex w-full justify-center opacity-30 transition-opacity hover:opacity-100">
          <button
            @click="hardResetApp"
            class="btn btn-ghost btn-xs text-error gap-2"
            data-testid="emergency-reset-button"
          >
            <LifebuoyIcon class="h-4 w-4" />
            {{ _t('Emergency Reset') }}
          </button>
        </div>
      </div>
      <div class="w-1/2 shadow-2xl">
        <img class="hidden h-screen w-full object-cover md:block" src="../assets/race.webp" />
      </div>
    </div>
  </div>
</template>
