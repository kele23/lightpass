<script setup lang="ts">
import { AdjustmentsHorizontalIcon } from '@heroicons/vue/24/solid';
import { _t } from '../services/dictionary.ts';
</script>

<template>
  <div class="drawer drawer-end xl:drawer-open grow xl:h-auto">
    <input id="internal-actions-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex min-h-0 flex-col xl:h-auto xl:overflow-visible">
      <!-- Mobile FAB -->
      <div class="fixed right-6 bottom-6 z-40 xl:hidden">
        <label
          for="internal-actions-drawer"
          class="btn btn-primary btn-circle h-14 w-14 border-none shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <AdjustmentsHorizontalIcon class="h-6 w-6" />
        </label>
      </div>

      <div class="w-full grow p-4 lg:p-8">
        <main class="w-full">
          <slot name="content" />
        </main>
        <slot name="after" />
      </div>
    </div>

    <!-- Sidebar Drawer -->
    <div class="drawer-side z-50 xl:h-auto xl:overflow-visible">
      <label for="internal-actions-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <div class="bg-base-300 min-h-full w-80 p-6 xl:min-h-0 xl:bg-transparent xl:p-0 xl:pt-8 xl:pr-8">
        <div class="flex flex-col gap-6">
          <div class="mb-4 flex items-center justify-between xl:hidden">
            <h2 class="text-primary text-xl font-black tracking-tighter uppercase italic">{{ _t('Actions') }}</h2>
            <label for="internal-actions-drawer" class="btn btn-ghost btn-sm btn-circle">✕</label>
          </div>
          <slot name="sidebar" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Assicuriamoci che il drawer si sovrapponga correttamente su mobile */
:deep(.drawer-side) {
  overflow-y: auto;
  scroll-behavior: smooth;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
