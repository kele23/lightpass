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

let tableData = ref([]);
tableData.value = await dbManager.getAllPSs(raceId);

/////////////////////////////////////////////////////
async function createPS(event) {
    const json = formToJSON(event.target);
    const data = { ...json, start: new Date(json.start).getTime(), race: raceId };
    await dbManager.createPS(data);

    //reset
    event.target.reset();
    tableData.value = await dbManager.getAllPSs(raceId);
}

async function uploadCsv(event) {
    const form = event.target;
    const files = form.querySelector('[type=file]').files;
    if (!files) return;

    //clean
    await dbManager.cleanTakes(raceId);
    await dbManager.cleanPSs(raceId);

    //read file
    const f = files[0];
    const arrayBuffer = await readFileAsync(f);
    const decoder = new TextDecoder('utf-8');
    const csv = decoder.decode(arrayBuffer);

    //read csv
    const results = Papa.parse(csv, {
        header: true,
    });

    //add item
    const rows = results.data;
    for (const row of rows) {
        await dbManager.createPS({
            ...row,
            start: parseInt(row.start),
            race: raceId,
        });
    }

    //reset
    form.reset();
    tableData.value = await dbManager.getAllPSs(raceId);
}

async function downloadCsv() {
    const csv = Papa.unparse(tableData.value);
    const csvContent = 'data:text/csv;charset=utf-8,' + csv;
    window.open(encodeURI(csvContent));
}
</script>

<template>
    <div class="w-full items-start lg:flex">
        <div class="w-full grow lg:w-auto lg:pr-4">
            <C1Table
                :data="tableData"
                :labels="['Name', 'Gap', 'Start', 'Order']"
                :keys="['name', 'gap', 'start', 'order']"
            />
        </div>
        <div class="w-full shrink-0 grow-0 lg:w-80">
            <form class="mb-4 rounded-lg bg-white shadow" @submit.prevent="createPS">
                <div class="px-6 py-4">
                    <div class="relative mt-6">
                        <div class="relative flex items-center justify-between text-base font-semibold leading-5">
                            <span class="text-gray-500"> Nuova PS </span>
                            <button
                                class="text-md flex items-center rounded-full bg-white p-2 shadow hover:text-gray-700"
                                title="Clear"
                                type="reset"
                            >
                                <BeakerIcon class="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div class="mt-6">
                        <div class="w-full space-y-6">
                            <div class="w-full">
                                <div class="relative">
                                    <input
                                        type="text"
                                        class="w-full flex-1 appearance-none rounded-lg border border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600"
                                        required
                                        placeholder="Nome"
                                        name="name"
                                    />
                                </div>
                            </div>
                            <div class="w-full">
                                <div class="relative">
                                    <input
                                        type="datetime-local"
                                        class="w-full flex-1 appearance-none rounded-lg border border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600"
                                        required
                                        placeholder="Start"
                                        name="start"
                                    />
                                </div>
                            </div>
                            <div class="w-full">
                                <div class="relative">
                                    <input
                                        type="text"
                                        class="w-full flex-1 appearance-none rounded-lg border border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600"
                                        placeholder="Gap"
                                        required
                                        name="gap"
                                        pattern="[0-9]+"
                                    />
                                </div>
                            </div>
                            <div class="w-full">
                                <div class="relative">
                                    <select
                                        class="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none"
                                        name="order"
                                        required
                                    >
                                        <option value="asc">Crescente</option>
                                        <option value="desc">Decrescente</option>
                                    </select>
                                </div>
                            </div>
                            <div class="w-full">
                                <button
                                    class="w-full rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                                    type="submit"
                                >
                                    Crea
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <form class="mb-4 rounded-lg bg-white shadow" @submit.prevent="uploadCsv">
                <div class="px-6 py-4">
                    <div class="relative mt-6">
                        <div class="relative flex items-center justify-between text-base font-semibold leading-5">
                            <span class="text-gray-500"> Carica PS </span>
                            <button
                                class="text-md flex items-center rounded-full bg-white p-2 shadow hover:text-gray-700"
                                title="Clear"
                                type="reset"
                            >
                                <BackspaceIcon class="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div class="mt-6">
                        <div class="w-full space-y-6">
                            <div class="w-full">
                                <div class="relative">
                                    <input
                                        type="file"
                                        class="w-full flex-1 appearance-none rounded-lg border border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600"
                                        placeholder="File"
                                        required
                                        name="file"
                                    />
                                </div>
                            </div>
                            <div class="w-full">
                                <button
                                    class="w-full rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                                    type="submit"
                                >
                                    Carica
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
