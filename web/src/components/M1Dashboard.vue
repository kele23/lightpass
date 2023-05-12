<script setup>
import { getDBManager } from '../services/db-manager';
import C1Table from './C1Table.vue';
import { useRoute } from 'vue-router';
import { BackspaceIcon, BeakerIcon } from '@heroicons/vue/24/solid';
import { ref, onUnmounted } from 'vue';
import { formToJSON, jsonToForm } from '../utils/form-to-json';
import { msToTime } from '../utils/dates';

/////////////////////////////////////////////////////
const dbManager = getDBManager();
const route = useRoute();
const raceId = route.params.race;
const pss = await dbManager.getAllPSs(raceId);

let selectedPs = ref();
let timesTableData = ref([]);
let takesTableData = ref([]);
let partialScoreData = ref([]);
const assignTime = ref(null);
const runnerNum = ref(null);

// initial reset
reset();

///////////////////////////////////////////////////// FNS
async function takeEvent(event) {
    newTime(await dbManager.getTime(event.detail));
    reset();
}

function newTime(time) {
    // check focus
    if (assignTime.value.contains(document.activeElement)) return;

    // get current ps
    const ps = pss.find((item) => item._id == selectedPs.value);

    // compile form
    const formData = {
        ...time,
        ps: ps?._id,
        timeStr: msToTime(time.time, true),
    };
    jsonToForm(assignTime.value, formData);

    // focus
    runnerNum.value.focus();
}

async function assignTimeFn(event) {
    const form = event.target;
    const json = formToJSON(form);

    if (!json._id) {
        console.warn('Cannot assign time without a Time ID');
        return;
    }

    const ps = await dbManager.getPS(json.ps);
    const runner = await dbManager.getRunnerBy({ number: json.runnerNum, race: raceId });
    if (!ps || !runner) {
        console.warn('Cannot find PS or Runner');
        return;
    }

    const take = await dbManager.getTakeBy({ ps: ps._id, runner: runner._id, race: raceId });
    if (take) {
        console.warn('Take already exists for this PS and Runner');
        return;
    }

    await dbManager.createTake({ time: json._id, ps: ps._id, runner: runner._id, race: raceId });

    // remove focus and reset
    assignTime.value.reset();
    document.activeElement.blur();
    reset();
}

async function removeTime(id) {
    await dbManager.deleteTime(id);
    reset();
}

async function editTime(id) {
    newTime(await dbManager.getTime(id));
}

async function removeTake(id) {
    await dbManager.deleteTake(id);
    reset();
}

async function reset() {
    timesTableData.value = await dbManager.getAllNonAssignedTimes(raceId);
    takesTableData.value = await dbManager.getAllTakesJoin(raceId, selectedPs.value);
    if (selectedPs.value) partialScoreData.value = await dbManager.getAllTakesJoinWithScore(raceId, selectedPs.value);
    else partialScoreData.value = [];
}

async function addPenalty(){
    
}

//////////////////////////////////////////////// OTH

document.body.addEventListener('take-event', takeEvent);
onUnmounted(() => document.body.removeEventListener('click', takeEvent));
</script>

<template>
    <div class="w-full items-start lg:flex">
        <div class="w-full grow lg:w-auto lg:pr-4">
            <div>
                <C1Table
                    :data="timesTableData"
                    :labels="['ID', 'Time']"
                    :keys="['_id', 'time']"
                    :editEnabled="true"
                    @removeClick="removeTime"
                    @editClick="editTime"
                    title="Tempi non assegnati"
                />
            </div>

            <div v-show="selectedPs" class="mt-8">
                <C1Table
                    :data="partialScoreData"
                    :labels="['Numero', 'Nome', 'Start', 'End', 'Pen', 'Tempo', 'Stato']"
                    :keys="['assigned', 'assignedName', 'start', 'assignedTime', 'penalty', 'diff', 'status']"
                    title="Classifica parziale"
                    :actionDisabled="true"
                />
            </div>

            <div class="mt-8">
                <C1Table
                    @removeClick="removeTake"
                    @editClick="addPenalty"
                    :edit-enabled="true"
                    :data="takesTableData"
                    :labels="['Time', 'PS', 'Numero', 'Nome', 'Pen']"
                    :keys="['assignedTime', 'assignedPs', 'assigned', 'assignedName', 'penalty']"
                    title="Tempi assegnati"
                />
            </div>
        </div>
        <div class="w-full shrink-0 grow-0 lg:sticky lg:top-0 lg:w-80">
            <div class="mb-4 rounded-lg bg-white shadow transition-colors">
                <div class="px-6 py-4">
                    <div class="w-full space-y-6">
                        <div class="w-full">
                            <select
                                class="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-700 shadow-sm focus:outline-none"
                                required
                                @change="
                                    ($event) => {
                                        selectedPs = $event.target.value;
                                        assignTime.reset();
                                        reset();
                                    }
                                "
                            >
                                <option value="">Tutte le PS</option>

                                <option
                                    v-for="item in pss"
                                    :key="item._id"
                                    :value="item._id"
                                    :selected="item._id == selectedPs"
                                >
                                    {{ item.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <form ref="assignTime" class="rounded-lg bg-white shadow transition-colors" @submit.prevent="assignTimeFn">
                <div class="px-6 py-4">
                    <div class="relative mt-6">
                        <div class="relative flex items-center justify-between text-base font-semibold leading-5">
                            <span class="text-gray-500"> Assegna </span>
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
                            <input type="hidden" required name="_id" />
                            <input type="hidden" required name="ps" v-if="selectedPs" />
                            <div class="w-full">
                                <div class="relative">
                                    <input
                                        type="text"
                                        class="w-full flex-1 appearance-none rounded-lg border border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600"
                                        required
                                        placeholder="Time"
                                        name="timeStr"
                                        readonly
                                    />
                                </div>
                            </div>
                            <div class="w-full" v-if="!selectedPs">
                                <div class="relative">
                                    <select
                                        class="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none"
                                        required
                                        name="ps"
                                    >
                                        <option value="">Seleziona PS</option>
                                        <option v-for="item in pss" :key="item._id" :value="item._id">
                                            {{ item.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div class="w-full">
                                <div class="relative">
                                    <input
                                        ref="runnerNum"
                                        type="text"
                                        class="w-full flex-1 appearance-none rounded-lg border border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600"
                                        required
                                        placeholder="Corridore (Numero)"
                                        name="runnerNum"
                                        pattern="[0-9]+"
                                    />
                                </div>
                            </div>

                            <div class="w-full">
                                <button
                                    class="w-full rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                                    type="submit"
                                >
                                    Assegna
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<style></style>
