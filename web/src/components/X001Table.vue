<script setup lang="ts">
import { PencilSquareIcon, XCircleIcon } from '@heroicons/vue/24/solid';
import { _t } from '../services/dictionary.ts';
import { date, datems, diff, onlyTimeMs, onlyTime } from '../utils/formats.ts';
import { computed, ref } from 'vue';
import { IDItem } from '../../types/iditem.ts';

const tableEl = ref<HTMLElement>();

defineEmits<{
  (e: 'removeClick', _id: string): void;
  (e: 'editClick', _id: string): void;
}>();

defineExpose({
  tableEl,
});

const props = defineProps<{
  title?: string;
  hideCount?: boolean;
  filterKey?: string | string[];
  data: IDItem[];
  labels: string[];
  keys: string[];
  format?: (string | ((data: any, item?: any) => string))[];
  actionDisabled?: boolean;
  editEnabled?: boolean;
  compact?: boolean;
  dataTestid?: string;
}>();

const filterValue = ref<string>('');
const filteredData = computed(() => {
  const key = props.filterKey;
  if (!key || !filterValue.value) {
    return props.data;
  }

  const regex = new RegExp(`.*${filterValue.value}.*`, 'i');
  const tmp = props.data.filter((item) => {
    if (typeof key == 'string') return item[key]?.match(regex);
    for (const k of key) {
      if (item[k]?.match(regex)) return true;
    }
    return false;
  });
  return tmp;
});

function format(data: any, formatIndex: number, item?: any) {
  if (!props.format) return data;

  const ff = props.format[formatIndex];
  if (typeof ff == 'string') {
    switch (ff) {
      case 'date': {
        return date(data);
      }
      case 'datems': {
        return datems(data);
      }
      case 'onlyTime': {
        return onlyTime(data);
      }
      case 'onlyTimeMs': {
        return onlyTimeMs(data);
      }
      case 'pInt': {
        return parseInt(data);
      }
      case 'diff': {
        return diff(data);
      }
      case 'bolder': {
        return `<b>${data}</b>`;
      }
      case 'pIntBolder': {
        return `<b>${parseInt(data)}</b>`;
      }
      case 'uppercase': {
        return `<span class="uppercase">${data}</span>`;
      }
      case 'pos': {
        return data
          ? `<span class="font-bold inline-block rounded-md min-w-[42px] px-2 bg-base-100 text-error border text-center text-red-700 text-base leading-5 print:bg-transparent print:border-none print:text-xs print:p-0 print:min-w-0">${data}</span>`
          : undefined;
      }
      case 'msToSec': {
        return data ? `${(data / 1000).toFixed(1)}s` : '-';
      }
      default:
        return data;
    }
  } else {
    return ff(data, item);
  }
}

function filter(event: SubmitEvent) {
  const formData = new FormData(event.target as HTMLFormElement);
  filterValue.value = formData.get('filter') as string;
}

const expandedRows = ref<Set<string>>(new Set());
function toggleExpand(id: string) {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id);
  } else {
    expandedRows.value.add(id);
  }
}
</script>

<template>
  <div class="">
    <!-- Header (Title & Filter) -->
    <div class="flex flex-col justify-between md:flex-row md:items-center">
      <div class="flex flex-row items-center">
        <h2 v-if="title" class="text-primary mr-4 text-lg font-black tracking-tighter uppercase italic transition-all">
          {{ title }}
        </h2>
        <div v-if="!hideCount" class="badge badge-neutral badge-lg font-mono font-bold">
          {{ filteredData.length }}
        </div>
      </div>
      <form v-if="filterKey" class="join mt-4 mb-0 w-full md:w-auto" @submit.prevent="filter($event as SubmitEvent)">
        <input
          type="text"
          class="input join-item input-bordered input-sm md:input-md w-full max-w-xs"
          name="filter"
          placeholder="Filtra..."
        />
        <button class="btn join-item btn-sm md:btn-md" type="submit">Filtra</button>
      </form>
    </div>

    <div class="py-4">
      <!-- Desktop View (Horizontal scroll if needed but styled better) -->
      <div class="border-base-content/10 hidden overflow-hidden rounded-xl border shadow-xl md:block">
        <div class="overflow-x-auto">
          <table class="bg-base-100 min-w-full table-auto leading-normal" ref="tableEl" :data-testid="dataTestid">
            <thead>
              <tr class="bg-secondary text-secondary-content">
                <th
                  v-for="label in labels"
                  :key="label"
                  scope="col"
                  :class="
                    compact
                      ? 'px-2 py-2 text-left text-[10px] font-black tracking-widest uppercase print:px-1 print:text-[8px]'
                      : 'px-4 py-4 text-left text-xs font-black tracking-widest uppercase print:px-1 print:text-[8px]'
                  "
                >
                  {{ _t(label) }}
                </th>

                <th
                  v-if="!actionDisabled"
                  scope="col"
                  :class="
                    compact
                      ? 'px-2 py-2 text-right text-[10px] font-black tracking-widest uppercase print:px-1 print:text-[8px]'
                      : 'px-4 py-4 text-right text-xs font-black tracking-widest uppercase print:px-1 print:text-[8px]'
                  "
                >
                  {{ _t('Actions') }}
                </th>
              </tr>
            </thead>
            <tbody ref="tbody">
              <tr
                v-for="item in filteredData"
                :key="item._id"
                class="group border-base-content/5 hover:bg-base-200/80 even:bg-base-200/40 border-b transition-colors"
                data-testid="table-row"
              >
                <td
                  v-for="(key, index) in keys"
                  :key="key"
                  :data-key="key"
                  :class="
                    compact ? 'px-2 py-1 text-xs print:px-1 print:py-0' : 'px-4 py-3 text-sm print:px-1 print:py-0'
                  "
                >
                  <span
                    :class="compact ? 'text-[11px] font-medium print:text-[8px]' : 'font-medium print:text-[10px]'"
                    v-html="format(item[key], index, item)"
                  ></span>
                </td>

                <td
                  v-if="!actionDisabled"
                  :class="
                    compact ? 'px-2 py-1 text-xs print:px-1 print:py-0' : 'px-4 py-3 text-sm print:px-1 print:py-0'
                  "
                >
                  <div class="flex justify-end gap-2">
                    <button
                      v-if="editEnabled"
                      class="btn btn-primary btn-sm btn-square"
                      title="Modifica"
                      data-testid="edit-button"
                      @click="$emit('editClick', item._id!)"
                    >
                      <PencilSquareIcon class="h-4 w-4" />
                    </button>
                    <button
                      class="btn btn-warning btn-sm btn-square"
                      title="Cancella"
                      data-testid="remove-button"
                      @click="$emit('removeClick', item._id!)"
                    >
                      <XCircleIcon class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="data.length == 0" class="bg-base-100">
                <td :colspan="keys.length + (actionDisabled ? 0 : 1)">
                  <div class="py-12 text-center text-xl font-medium italic opacity-40">{{ _t('No items') }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile View (Cards) -->
      <div class="space-y-3 md:hidden">
        <div
          v-if="filteredData.length == 0"
          class="card bg-base-200 p-8 text-center text-lg font-medium italic opacity-40"
        >
          {{ _t('No items') }}
        </div>

        <div
          v-for="item in filteredData"
          :key="item._id"
          class="card border-base-content/10 bg-base-100 cursor-pointer overflow-hidden border shadow-md transition-all active:scale-[0.98]"
          @click.stop="toggleExpand(item._id!)"
        >
          <div class="card-body relative gap-2 p-3">
            <div
              v-if="keys.length > 3"
              class="pointer-events-none absolute right-3 bottom-2 text-xs font-bold uppercase opacity-20"
            >
              {{ expandedRows.has(item._id!) ? 'LESS' : 'MORE' }}
            </div>
            <div class="flex items-start justify-between">
              <div class="flex flex-col">
                <span
                  class="text-primary mb-1 text-[9px] leading-none font-black tracking-tighter uppercase opacity-60"
                >
                  {{ _t(labels[0]) }}
                </span>
                <div class="text-lg font-black tracking-tight" v-html="format(item[keys[0]], 0, item)"></div>
              </div>

              <div class="flex shrink-0 gap-2">
                <button
                  v-if="editEnabled"
                  class="btn btn-primary btn-sm btn-square"
                  @click.stop="$emit('editClick', item._id!)"
                >
                  <PencilSquareIcon class="h-4 w-4" />
                </button>
                <button
                  v-if="!actionDisabled"
                  class="btn btn-warning btn-sm btn-square"
                  @click.stop="$emit('removeClick', item._id!)"
                >
                  <XCircleIcon class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div class="border-base-content/5 grid grid-cols-2 gap-x-2 gap-y-3 border-t pt-2" v-if="keys.length > 1">
              <template v-for="(key, index) in keys.slice(1)" :key="key">
                <div v-if="expandedRows.has(item._id!) || index < 2" class="flex flex-col">
                  <span class="mb-1 text-[9px] leading-none font-black tracking-tighter uppercase opacity-40">
                    {{ _t(labels[index + 1]) }}
                  </span>
                  <div
                    class="truncate text-sm leading-tight font-bold"
                    v-html="format(item[key], index + 1, item)"
                  ></div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
