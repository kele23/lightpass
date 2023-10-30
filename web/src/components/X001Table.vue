<script setup lang="ts">
import { MinusCircleIcon, PencilSquareIcon } from '@heroicons/vue/24/solid';
import { IDItem } from '../interfaces/db';
import { _t } from '../services/dictionary';
import { date, datems, diff } from '../utils/formats';

defineEmits<{
    (e: 'removeClick', _id: string): void;
    (e: 'editClick', _id: string): void;
}>();

const props = defineProps<{
    title?: string;
    hideCount?: boolean;
    filterKey?: string;
    data: IDItem[];
    labels: string[];
    keys: string[];
    showPos?: boolean;
    format?: (string | ((data: any) => string))[];
    actionDisabled?: boolean;
    editEnabled?: boolean;
}>();

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
            case 'pInt': {
                return parseInt(data);
            }
            case 'diff': {
                return diff(data);
            }
            default:
                return data;
        }
    } else {
        return ff(data);
    }
}
</script>

<template>
    <div class="">
        <div class="flex flex-col justify-between md:flex-row md:items-center">
            <div class="flex flex-row items-center">
                <h2 v-if="title" class="mr-4 text-lg font-semibold">{{ title }}</h2>
                <div v-if="!hideCount" class="btn-circle btn pointer-events-none">
                    {{ data.length }}
                </div>
            </div>
            <form v-if="filterKey" class="mt-4 mb-0 flex flex-col md:mt-0 md:flex-row">
                <div class="relative">
                    <input
                        type="text"
                        class="input-bordered input w-full max-w-xs"
                        name="filter"
                        placeholder="Filtra..."
                    />
                </div>
                <button class="btn" type="submit">Filtra</button>
            </form>
        </div>
        <div class="overflow-x-auto py-4">
            <div class="inline-block min-w-full overflow-hidden rounded-lg shadow">
                <table class="min-w-full table-auto leading-normal">
                    <thead>
                        <tr class="bg-accent text-accent-content">
                            <th
                                v-if="showPos"
                                class="px-2 py-3 text-left text-sm font-semibold uppercase print:px-1 print:text-xs"
                            >
                                {{ _t('POS') }}
                            </th>
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
                                Azioni
                            </th>
                        </tr>
                    </thead>
                    <tbody ref="tbody">
                        <tr
                            v-for="(item, index) in data"
                            :key="item._id"
                            class="group h-16 odd:bg-base-300 even:bg-base-200"
                        >
                            <td v-if="showPos" class="px-2 py-2 text-sm print:py-0 print:px-1">
                                {{ index + 1 }}
                            </td>
                            <td v-for="(key, index) in keys" :key="key" class="px-2 py-2 text-sm print:py-0 print:px-1">
                                <p class="whitespace-no-wrap break-all print:text-xs">{{ format(item[key], index) }}</p>
                            </td>
                            <td v-if="!actionDisabled" class="px-2 py-2 text-sm print:py-0 print:px-1">
                                <div class="flew-row flex justify-end gap-2">
                                    <button
                                        v-if="editEnabled"
                                        class="btn group-odd:bg-base-200 group-even:bg-base-300"
                                        title="Modifica"
                                        @click="$emit('editClick', item._id!)"
                                    >
                                        <PencilSquareIcon class="h-4 w-4 text-left" />
                                    </button>
                                    <button
                                        class="btn group-odd:bg-base-200 group-even:bg-base-300"
                                        title="Cancella"
                                        @click="$emit('removeClick', item._id!)"
                                    >
                                        <MinusCircleIcon class="h-4 w-4 text-left" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="data.length == 0" class="bg-base-300">
                            <td :colspan="keys.length + (actionDisabled ? 0 : 1) + (showPos ? 1 : 0)">
                                <div class="py-4 text-center text-xl">{{ _t('No items') }}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
