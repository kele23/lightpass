<script setup lang="ts">
import { computed } from 'vue';
import X200Widget from './X200Widget.vue';
import { _t } from '../services/dictionary.ts';
import { BackspaceIcon, ChevronDownIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
  data: any[];
}>();

const selectedCategories = defineModel<string[]>('categories', { default: () => [] });
const selectedTeams = defineModel<string[]>('teams', { default: () => [] });
const extended = defineModel<boolean>('extended', { default: false });

const categories = computed(() => {
  const cats = new Set(props.data?.map((d) => d.category).filter(Boolean) || []);
  return Array.from(cats).sort();
});

const teams = computed(() => {
  const ts = new Set(props.data?.map((d) => d.team).filter(Boolean) || []);
  return Array.from(ts).sort();
});

function clearFilters() {
  selectedCategories.value = [];
  selectedTeams.value = [];
}
</script>
<template>
  <X200Widget v-if="categories.length > 0 || teams.length > 0">
    <div class="flex items-center justify-between">
      <span class="font-bold"> {{ _t('Filters') }} </span>
      <button class="btn" title="Clear" @click="clearFilters" data-testid="filter-clear">
        <BackspaceIcon class="h-6 w-6" />
      </button>
    </div>

    <div class="mt-6" v-if="categories.length > 0">
      <label class="label px-1 py-0 pb-1"
        ><span class="label-text font-semibold">{{ _t('Category') }}</span></label
      >
      <details class="dropdown w-full" data-testid="filter-category-dropdown">
        <summary class="btn w-full flex-nowrap justify-between font-normal">
          <span class="block w-full truncate text-left">
            {{ selectedCategories.length > 0 ? selectedCategories.join(', ') : _t('All Categories') }}
          </span>
          <ChevronDownIcon class="h-4 w-4 shrink-0 opacity-50" />
        </summary>
        <ul
          class="menu dropdown-content bg-base-100 rounded-box border-base-content/10 z-[1] mt-1 max-h-64 w-full flex-nowrap overflow-auto border p-2 shadow"
        >
          <li v-for="cat in categories" :key="cat">
            <label class="label hover:bg-base-200 flex cursor-pointer justify-start gap-3 rounded-lg py-2">
              <input type="checkbox" :value="cat" v-model="selectedCategories" class="checkbox checkbox-sm" />
              <span class="label-text">{{ cat }}</span>
            </label>
          </li>
        </ul>
      </details>
    </div>

    <div class="mt-6" v-if="teams.length > 0">
      <label class="label px-1 py-0 pb-1"
        ><span class="label-text font-semibold">{{ _t('Team') }}</span></label
      >
      <details class="dropdown w-full" data-testid="filter-team-dropdown">
        <summary class="btn w-full flex-nowrap justify-between font-normal">
          <span class="block w-full truncate text-left">
            {{ selectedTeams.length > 0 ? selectedTeams.join(', ') : _t('All Teams') }}
          </span>
          <ChevronDownIcon class="h-4 w-4 shrink-0 opacity-50" />
        </summary>
        <ul
          class="menu dropdown-content bg-base-100 rounded-box border-base-content/10 z-[1] mt-1 max-h-64 w-full flex-nowrap overflow-auto border p-2 shadow"
        >
          <li v-for="team in teams" :key="team">
            <label class="label hover:bg-base-200 flex cursor-pointer justify-start gap-3 rounded-lg py-2">
              <input type="checkbox" :value="team" v-model="selectedTeams" class="checkbox checkbox-sm" />
              <span class="label-text">{{ team }}</span>
            </label>
          </li>
        </ul>
      </details>
    </div>

    <div class="mt-6 flex items-center justify-between px-1">
      <span class="label-text font-semibold">{{ _t('Extended View') }}</span>
      <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="extended" data-testid="filter-extended-toggle" />
    </div>
  </X200Widget>
</template>
