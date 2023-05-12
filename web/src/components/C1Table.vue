<script setup>
import { defineProps } from 'vue';
import { BeakerIcon, MinusCircleIcon, PencilSquareIcon } from '@heroicons/vue/24/solid';
import { getCurrentInstance } from 'vue';
defineProps({
    title: {
        type: String,
        default: null,
    },
    hideCount: {
        type: Boolean,
        default: false,
    },
    filterKey: {
        type: String,
        default: null,
    },
    data: {
        type: Array,
        default: () => {
            return [];
        },
    },
    labels: {
        type: Array,
        default: () => {
            return [];
        },
    },
    keys: {
        type: Array,
        default: () => {
            return [];
        },
    },
    actionDisabled: {
        type: Boolean,
        default: false,
    },
    editEnabled: {
        type: Boolean,
        default: false,
    },
});
</script>

<template>
    <div class="">
        <div class="flex flex-col justify-between md:flex-row md:items-center">
            <div class="flex flex-row items-center">
                <h2 v-if="title" class="mr-4 text-lg font-semibold dark:text-white">{{ title }}</h2>
                <div
                    v-if="!hideCount"
                    class="text-md flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-2 font-semibold text-gray-600 shadow hover:text-gray-700"
                >
                    {{ data.length }}
                </div>
            </div>
            <form v-if="filterKey" class="mt-4 mb-0 flex flex-col md:mt-0 md:flex-row">
                <div class="relative">
                    <input
                        type="text"
                        class="w-full flex-1 appearance-none rounded-lg border border-transparent border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 dark:bg-black dark:text-gray-100 dark:focus:ring-gray-100"
                        name="filter"
                        placeholder="Filtra..."
                    />
                </div>
                <button
                    class="mt-1 flex-shrink-0 self-end rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200 md:mt-0 md:ml-1"
                    type="submit"
                >
                    Filtra
                </button>
            </form>
        </div>
        <div class="overflow-x-auto py-4">
            <div class="inline-block min-w-full overflow-hidden rounded-lg shadow">
                <table class="min-w-full table-auto leading-normal">
                    <thead>
                        <tr>
                            <th
                                v-for="label in labels"
                                :key="label"
                                scope="col"
                                class="border-b border-gray-200 bg-white px-2 py-3 text-left text-sm font-semibold uppercase text-gray-800 print:px-1 print:text-xs"
                            >
                                {{ label }}
                            </th>

                            <th
                                v-if="!actionDisabled"
                                scope="col"
                                class="border-b border-gray-200 bg-white px-2 py-3 text-right text-sm font-semibold uppercase text-gray-800 print:px-1 print:text-xs"
                            >
                                Azioni
                            </th>
                        </tr>
                    </thead>
                    <tbody ref="tbody">
                        <tr v-for="item in data" :key="item._id" class="odd:bg-white even:bg-slate-50">
                            <td
                                v-for="key in keys"
                                :key="key"
                                class="border-b border-gray-200 px-2 py-2 text-sm print:py-0 print:px-1"
                            >
                                <p class="whitespace-no-wrap text-gray-900 print:text-xs">{{ item[key] }}</p>
                            </td>
                            <td
                                v-if="!actionDisabled"
                                class="border-b border-gray-200 px-2 py-2 text-sm print:py-0 print:px-1"
                            >
                                <div class="flew-row flex justify-end">
                                    <button
                                        v-if="editEnabled"
                                        class="hover:text-white-700 text-md mr-1 flex items-center rounded-full bg-gray-500 p-1 text-white shadow"
                                        title="Modifica"
                                        @click="$emit('editClick', item._id)"
                                    >
                                        <PencilSquareIcon class="h-4 w-4 text-left" />
                                    </button>
                                    <button
                                        class="hover:text-white-700 text-md flex items-center rounded-full bg-gray-500 p-1 text-white shadow"
                                        title="Cancella"
                                        @click="$emit('removeClick', item._id)"
                                    >
                                        <MinusCircleIcon class="h-4 w-4 text-left" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
