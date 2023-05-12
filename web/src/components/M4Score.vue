<script setup>
import { getDBManager } from '../services/db-manager';
import C1Table from './C1Table.vue';
import { BackspaceIcon, BeakerIcon } from '@heroicons/vue/24/solid';
import { useRoute } from 'vue-router';
import { formToJSON } from '../utils/form-to-json';
import Papa from 'papaparse';
import { ref } from 'vue';
import { readFileAsync } from '../utils/files';

/////////////////////////////////////////////////////
const dbManager = getDBManager();

const route = useRoute();
const raceId = route.params.race;
const psId = route.params.ps;

const categories = await dbManager.getAllCategories(raceId);
const teams = await dbManager.getAllTeams(raceId);

let selectedTeams = null;
let selectedCategories = null;
let tableData = ref([]);
reset(); // initial reset

async function selectCategory(event) {
    const data = formToJSON(event.target);
    selectedTeams = data.selectTeam ? [data.selectTeam] : [];
    reset();
}

async function selectTeam(event) {
    const data = formToJSON(event.target);
    selectedTeams = data.selectTeam ? [data.selectTeam] : [];
    reset();
}

async function downloadCsv() {
    const csv = Papa.unparse(tableData.value);
    const csvContent = 'data:text/csv;charset=utf-8,' + csv;
    window.open(encodeURI(csvContent));
}

async function reset() {
    tableData.value = await dbManager.getScore(psId, raceId, selectedCategories, selectedTeams);
}
</script>

<template>
    <div class="w-full items-start lg:flex">
        <div class="w-full grow lg:w-auto lg:pr-4">
            <C1Table
                :data="tableData"
                :labels="['Num', 'Nome', 'Cat', 'Team', 'Fci', 'Uci', 'Soc', 'Naz']"
                :keys="['number', 'name', 'category', 'team', 'fci', 'uci', 'soc', 'naz']"
            />
        </div>
        <div class="w-full shrink-0 grow-0 lg:w-80">
            <form class="mb-4 rounded-lg bg-white shadow" @submit.prevent="selectCategory">
                <div class="px-6 py-4">
                    <div class="relative mb-4">
                        <div class="relative flex items-center justify-between text-base font-semibold leading-5">
                            <span class="text-gray-500"> Seleziona Categorie </span>
                            <button
                                class="text-md flex items-center rounded-full bg-white p-2 shadow hover:text-gray-700"
                                title="Clear"
                                type="reset"
                            >
                                <BackspaceIcon class="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div class="w-full space-y-6">
                        <div class="w-full">
                            <div
                                class="mb-4 mr-4 inline-flex items-center"
                                v-for="category of categories"
                                :key="category"
                            >
                                <input
                                    :id="'checkbox--' + category"
                                    :name="category"
                                    type="checkbox"
                                    value="true"
                                    class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                                />
                                <label
                                    :for="'checkbox--' + category"
                                    class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                    >{{ category }}</label
                                >
                            </div>
                        </div>
                    </div>
                    <div class="mt-6">
                        <div class="w-full space-y-6">
                            <div class="w-full">
                                <button
                                    class="w-full rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                                >
                                    Applica
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <form class="mb-4 rounded-lg bg-white shadow">
                <div class="px-6 py-4">
                    <div class="relative mb-4">
                        <div class="relative flex items-center justify-between text-base font-semibold leading-5">
                            <span class="text-gray-500"> Seleziona Team </span>
                            <button
                                class="text-md flex items-center rounded-full bg-white p-2 shadow hover:text-gray-700"
                                title="Clear"
                                type="reset"
                            >
                                <BackspaceIcon class="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div class="w-full space-y-6">
                        <div class="w-full">
                            <select
                                class="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-700 shadow-sm focus:outline-none"
                                name="selectTeam"
                            >
                                <option value="">Tutti i Team</option>
                                <option :value="team" v-for="team of teams" :key="team">
                                    {{ team }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-6">
                        <div class="w-full space-y-6">
                            <div class="w-full">
                                <button
                                    class="w-full rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                                >
                                    Applica
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <form class="mb-4 rounded-lg bg-white shadow">
                <div class="px-6 py-4">
                    <div class="relative mb-4">
                        <div class="relative flex items-center justify-between text-base font-semibold leading-5">
                            <span class="text-gray-500"> Stampa </span>
                            <button
                                class="text-md flex items-center rounded-full bg-white p-2 shadow hover:text-gray-700"
                                title="Clear"
                                type="reset"
                            >
                                <BackspaceIcon class="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div class="w-full">
                        <div class="relative">
                            <input
                                type="text"
                                class="w-full flex-1 appearance-none rounded-lg border border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600"
                                placeholder="Titolo"
                                name="title"
                            />
                        </div>
                    </div>
                    <div class="mt-4 w-full">
                        <div class="relative">
                            <input
                                type="text"
                                class="w-full flex-1 appearance-none rounded-lg border border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600"
                                placeholder="Sottotitolo"
                                name="subtitle"
                            />
                        </div>
                    </div>
                    <div class="mt-6">
                        <div class="w-full space-y-6">
                            <div class="w-full">
                                <button
                                    class="w-full rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                                >
                                    Stampa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <div class="rounded-lg bg-white shadow">
                <div class="px-6 py-4">
                    <div class="w-full">
                        <button
                            class="w-full rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                            type="button"
                            @click="downloadCsv"
                        >
                            Scarica CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
