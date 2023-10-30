<script setup lang="ts">
import { BackspaceIcon } from '@heroicons/vue/24/solid';
import { ref, watch } from 'vue';
import { usePS } from '../composable/usePS';
import { useRace } from '../composable/useRace';
import { useRunners } from '../composable/useRunners';
import { useTakes } from '../composable/useTakes';
import { useTimes } from '../composable/useTimes';
import { _t } from '../services/dictionary';
import { jsonToForm } from '../utils/form-to-json';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import useToasterStore from '../stores/toaster';
import X200Widget from './X200Widget.vue';
import { TakeType } from '../interfaces/db';
import { addTake, removeTake, removeTime } from '../services/db';

const toasterStore = useToasterStore();
const { currentRace } = useRace();
const { times } = useTimes();
const { pss } = usePS();
const { runners } = useRunners();
const { takes, selectedPs, selectPs } = useTakes();
const assignTime = ref<HTMLFormElement>();
const type = ref('end');

function changePs(event: Event) {
    selectPs((event.target as HTMLInputElement)?.value);
}

watch([type, selectedPs], () => {
    assignTime.value?.reset();
});

function populateAssign(_id: string) {
    if (!assignTime.value) return;

    const timeId = _id;
    const raceId = currentRace.value?._id;
    const psId = selectedPs.value?._id;

    // compile form
    const formData = {
        timeId,
        raceId,
        psId,
        timeStr: 'booo',
        type: type.value,
    };
    jsonToForm(assignTime.value, formData);
}

async function submitTake(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    if (!formData.get('timeId')) return;

    try {
        await addTake(
            formData.get('raceId')!.toString(),
            formData.get('timeId')!.toString(),
            formData.get('psId')!.toString(),
            formData.get('runnerId')!.toString(),
            parseInt(formData.get('type')!.toString()) == TakeType.start ? TakeType.start : TakeType.end
        );
        assignTime.value?.reset();
    } catch (e) {
        toasterStore.error({ text: _t('Take already exists') });
    }
}

async function delTake(_id: string) {
    const raceId = currentRace.value?._id;
    if (!raceId) return;

    await removeTake(raceId, _id);
}
</script>

<template>
    <L002MainInternal>
        <template #content>
            <h1 class="mb-6">
                <b class="text-3xl">{{ _t('Dashboard') }}</b>
            </h1>
            <X001Table
                :data="times"
                title="Times"
                :labels="['Time']"
                :keys="['time']"
                :editEnabled="true"
                :format="['datems']"
                @removeClick="(_id) => removeTime(_id)"
                @editClick="(_id) => populateAssign(_id)"
            />
            <X001Table
                title="Assigned Times"
                :data="takes"
                :labels="['Time', 'Runner', 'PS', 'Type']"
                :keys="['time', 'runner', 'ps', 'type']"
                :format="['datems', 'pInt', 'string', 'string']"
                @removeClick="(_id) => delTake(_id)"
            />
        </template>
        <template #sidebar>
            <X200Widget>
                <div class="form-control w-full max-w-xs">
                    <label class="label">
                        <span class="label-text">Select current PS</span>
                    </label>
                    <select class="select-bordered select w-full max-w-xs" @change="changePs">
                        <option value="">Tutte le PS</option>
                        <option v-for="ps in pss" :key="ps._id" :value="ps._id" :selected="ps._id == selectedPs?._id">
                            {{ ps.name }}
                        </option>
                    </select>
                </div>

                <div class="form-control mt-2 w-full max-w-xs">
                    <label class="label">
                        <span class="label-text">Time modality</span>
                    </label>
                    <select class="select-bordered select w-full max-w-xs" v-model="type">
                        <option :value="TakeType.start">{{ _t('PS Start') }}</option>
                        <option :value="TakeType.end">{{ _t('PS End') }}</option>
                    </select>
                </div>
            </X200Widget>
            <X200Widget>
                <form ref="assignTime" @submit.prevent="submitTake($event as SubmitEvent)">
                    <div class="flex items-center justify-between">
                        <span class="font-bold"> {{ _t('Assign') }} </span>
                        <button class="btn" title="Clear" type="reset">
                            <BackspaceIcon class="h-6 w-6" />
                        </button>
                    </div>

                    <input type="hidden" required name="raceId" />
                    <input type="hidden" required name="timeId" />
                    <input type="hidden" required name="type" />

                    <div class="mt-6">
                        <input
                            type="text"
                            class="input-bordered input w-full max-w-xs"
                            required
                            placeholder="Time"
                            name="timeStr"
                            readonly
                        />
                    </div>
                    <div class="mt-6">
                        <select class="select-bordered select w-full max-w-xs" required name="psId">
                            <option value=""></option>
                            <option v-for="ps in pss" :key="ps._id" :value="ps._id">
                                {{ ps.name }}
                            </option>
                        </select>
                    </div>

                    <div class="mt-6">
                        <select class="select-bordered select w-full max-w-xs" required name="runnerId">
                            <option value=""></option>
                            <option v-for="runner in runners" :key="runner._id" :value="runner._id">
                                {{ runner.number }}
                            </option>
                        </select>
                    </div>

                    <div class="mt-6 w-full">
                        <button class="btn-primary btn" type="submit">Assegna</button>
                    </div>
                </form>
            </X200Widget>
        </template>
    </L002MainInternal>
</template>

<style></style>
