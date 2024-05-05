<script setup lang="ts">
import { PencilSquareIcon, XCircleIcon } from '@heroicons/vue/24/solid';
import { IDItem } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import { date, datems, diff, onlyTimeMs, onlyTime } from '../utils/formats.ts';
import { computed, ref } from 'vue';

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
    format?: (string | ((data: any) => string))[];
    actionDisabled?: boolean;
    editEnabled?: boolean;
}>();

const filterValue = ref<string>('');
const filteredData = computed(() => {
    const key = props.filterKey;
    if (!key || !filterValue.value) return props.data;

    const regex = new RegExp(`.*${filterValue.value}.*`, 'i');
    return props.data.filter((item) => {
        if (typeof key == 'string') return item[key]?.match(regex);
        for (const k of key) {
            if (item[k]?.match(regex)) return true;
        }
        return false;
    });
});

function format(data: any, formatIndex: number) {
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
                    ? `<span class="font-bold inline-block rounded-md min-w-[42px] px-2 print:px-1 bg-base-100 text-error border text-center text-red-700 text-base print:text-sm">${data}</b>`
                    : undefined;
            }
            default:
                return data;
        }
    } else {
        return ff(data);
    }
}

function filter(event: SubmitEvent) {
    const formData = new FormData(event.target as HTMLFormElement);
    filterValue.value = formData.get('filter') as string;
}
</script>

<template>
    <div class="">
        <div class="flex flex-col justify-between md:flex-row md:items-center">
            <div class="flex flex-row items-center">
                <h2 v-if="title" class="mr-4 text-lg font-semibold">{{ title }}</h2>
                <div v-if="!hideCount" class="btn btn-circle pointer-events-none">
                    {{ filteredData.length }}
                </div>
            </div>
            <form v-if="filterKey" class="join mb-0 mt-4" @submit.prevent="filter($event as SubmitEvent)">
                <input
                    type="text"
                    class="input join-item input-bordered w-full max-w-xs"
                    name="filter"
                    placeholder="Filtra..."
                />
                <button class="btn join-item" type="submit">Filtra</button>
            </form>
        </div>
        <div class="overflow-x-auto py-4">
            <div class="inline-block min-w-full overflow-hidden rounded-lg shadow">
                <table class="min-w-full table-auto leading-normal" ref="tableEl">
                    <thead>
                        <tr class="bg-accent text-accent-content">
                            <th
                                v-for="label in labels"
                                :key="label"
                                scope="col"
                                class="px-2 py-3 text-left text-sm font-semibold uppercase print:px-1 print:text-xs"
                            >
                                {{ label }}
                            </th>

                            <th
                                v-if="!actionDisabled"
                                scope="col"
                                class="px-2 py-3 text-right text-sm font-semibold uppercase print:px-1 print:text-xs"
                            >
                                {{ _t('Actions') }}
                            </th>
                        </tr>
                    </thead>
                    <tbody ref="tbody">
                        <tr
                            v-for="item in filteredData"
                            :key="item._id"
                            class="group h-12 odd:bg-base-300 even:bg-base-200"
                        >
                            <td v-for="(key, index) in keys" :key="key" class="px-2 py-1 text-sm print:px-1 print:py-0">
                                <p
                                    class="whitespace-no-wrap break-all print:text-xs"
                                    v-html="format(item[key], index)"
                                ></p>
                            </td>

                            <td v-if="!actionDisabled" class="px-2 py-1 text-sm print:px-1 print:py-0">
                                <div class="flew-row flex justify-end gap-2">
                                    <button
                                        v-if="editEnabled"
                                        class="btn btn-primary btn-sm"
                                        title="Modifica"
                                        @click="$emit('editClick', item._id!)"
                                    >
                                        <PencilSquareIcon class="h-4 w-4 text-left" />
                                    </button>
                                    <button
                                        class="btn btn-warning btn-sm"
                                        title="Cancella"
                                        @click="$emit('removeClick', item._id!)"
                                    >
                                        <XCircleIcon class="h-4 w-4 text-left" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="data.length == 0" class="bg-base-300">
                            <td :colspan="keys.length + (actionDisabled ? 0 : 1)">
                                <div class="py-4 text-center text-xl">{{ _t('No items') }}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
