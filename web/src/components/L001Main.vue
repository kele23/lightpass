<script setup lang="ts">
import { Bars3Icon, SignalIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';
import { onMounted, onUnmounted, ref } from 'vue';
import { useLightpassSensor } from '../composable/useLightpassSensor.ts';
import { useLogin } from '../composable/useLogin.ts';
import X002Nav from './X002Nav.vue';

const { isConnected, requestDevice } = useLightpassSensor();
const { isReadOnly } = useLogin();
const currentTime = ref<string>(format(new Date(), 'HH:mm:ss'));

let interval: any = undefined;
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
        class="bg-base-200 sticky top-0 z-30 flex h-16 w-full items-center justify-between px-4 shadow xl:static xl:z-0 xl:justify-end"
      >
        <label for="main-drawer" class="btn-empty btn btn-square drawer-button xl:hidden">
          <Bars3Icon class="h-6 w-6"
        /></label>

        <div class="flex items-center gap-2">
          <span class="font-mono text-sm font-bold md:text-base">{{ currentTime }}</span>
          <button
            v-if="!isReadOnly"
            class="btn btn-sm btn-square md:btn-md md:w-auto md:px-4"
            v-bind:class="isConnected ? 'btn-primary' : 'btn-ghost'"
            @click="requestDevice()"
          >
            <SignalIcon class="h-5 w-5 md:h-6 md:w-6" />
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
    <div class="drawer-side z-40">
      <label for="main-drawer" class="drawer-overlay"></label>
      <X002Nav class="" />
    </div>
  </div>
</template>
