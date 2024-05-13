<script setup lang="ts">
import { BackspaceIcon } from '@heroicons/vue/24/solid';
import { ref, watch } from 'vue';
import { usePS } from '../composable/usePS.ts';
import { useRace } from '../composable/useRace.ts';
import { useRunners } from '../composable/useRunners.ts';
import { useDashboard } from '../composable/useDashboard.ts';
import { useTimes } from '../composable/useTimes.ts';
import { PS, TakeType } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import useToasterStore from '../stores/toaster.ts';
import { jsonToForm } from '../utils/form-to-json.ts';
import { datems } from '../utils/formats.ts';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X200Widget from './X200Widget.vue';
import X300ModalConfirm from './X300ModalConfirm.vue';
import { useConfirmDialog } from '@vueuse/core';
import { useRoute } from 'vue-router';

const toasterStore = useToasterStore();
const { currentRace } = useRace();
const { removeTime } = useTimes();
const { pss } = usePS();
const { runners } = useRunners();
const selectedPs = ref<PS>();
const type = ref<TakeType>();
const { times, score, takes, addTake, removeTake } = useDashboard(selectedPs, type);
const numberInput = ref<HTMLElement>();
const route = useRoute();


const { isRevealed: isTakeDelRevealed, reveal: revealTakeDel, confirm: confirmTakeDel } = useConfirmDialog();
const { isRevealed: isTimeDelRevealed, reveal: revealTimeDel, confirm: confirmTimeDel } = useConfirmDialog();

const assignTime = ref<HTMLFormElement>();
function changePs(event: Event) {
    selectedPs.value = pss.value.find((item) => item._id == (event.target as HTMLInputElement)?.value);
}

watch([route], () => {
    type.value = route.meta.type as TakeType;
    console.log(type.value);
}, {immediate: true});

watch([type, selectedPs], () => {
    assignTime.value?.reset();
});

async function populateAssign(_id: string) {
    if (!assignTime.value) return;

    const timeId = _id;
    const raceId = currentRace.value?._id;
    const psId = selectedPs.value;

    const time = times.value.find((item) => item._id == _id);
    if (!time) return;

    // compile form
    const formData = {
        timeId,
        timeNum: time.time,
        raceId,
        psId,
        timeStr: datems(time.time),
        type: type.value,
    };
    jsonToForm(assignTime.value, formData);

    numberInput.value?.focus();
}

async function submitTake(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    if (!formData.get('timeId')) return;

    try {
        await addTake(
            {
                time: parseInt(formData.get('timeNum')!.toString()),
                ps: formData.get('psId')!.toString(),
                runner: formData.get('runnerId')!.toString(),
                type: parseInt(formData.get('type')!.toString()) == TakeType.start ? TakeType.start : TakeType.end,
            },
            formData.get('timeId')!.toString()
        );
        assignTime.value?.reset();
    } catch (e) {
        toasterStore.error({ text: _t('Take already exists') });
    }
}

const delTake = async (id: string) => {
    const { data, isCanceled } = await revealTakeDel();
    if (!isCanceled && data) {
        await removeTake(id);
    }
};

const delTime = async (id: string) => {
    const { data, isCanceled } = await revealTimeDel();
    if (!isCanceled && data) {
        await removeTime(id);
    }
};
</script>

<template>
    <L002MainInternal>
        <template #content>
            <h1 class="mb-6">
                <b class="text-3xl">{{  type == TakeType.start ? "START" : "FINISH" }}</b>
            </h1>

            <X001Table
                :data="times"
                title="Times"
                :labels="['Time']"
                :keys="['time']"
                :editEnabled="true"
                :format="['datems']"
                @removeClick="(_id) => delTime(_id)"
                @editClick="(_id) => populateAssign(_id)"
            />

            <X001Table
                v-if="selectedPs"
                :data="score"
                title="Partial score"
                :actionDisabled="true"
                :hideCount="true"
                :labels="['Number', 'Name', 'Start', 'End', 'Diff', 'Pos']"
                :keys="['number', 'name', 'start', 'end', 'diff', 'pos']"
                :format="['bolder', 'string', 'onlyTimeMs', 'onlyTimeMs', 'diff', 'pos']"
            />

            <X001Table
                :title="_t('Takes')"
                :data="takes"
                :labels="['Runner', 'Time', 'PS', 'Type']"
                :keys="['runnerNumber', 'time', 'psName', 'type']"
                :format="[ 'pIntBolder','onlyTimeMs', 'uppercase', (data: TakeType) => data == TakeType.start ? 'START' : 'END']"
                @removeClick="(_id) => delTake(_id)"
            />
        </template>
        <template #sidebar>
            <X200Widget>
                <div class="form-control w-full max-w-xs">
                    <label class="label">
                        <span class="label-text">{{ _t('Select PS') }}</span>
                    </label>
                    <select class="select select-bordered w-full max-w-xs" @change="changePs">
                        <option value="">{{ _t('All PS') }}</option>
                        <option v-for="ps in pss" :key="ps._id" :value="ps._id" :selected="ps._id == selectedPs?._id">
                            {{ ps.name }}
                        </option>
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
                    <input type="hidden" required name="timeNum" />
                    <input type="hidden" required name="type" />

                    <div class="mt-6">
                        <input
                            type="text"
                            class="input input-bordered w-full max-w-xs"
                            required
                            placeholder="Time"
                            name="timeStr"
                            readonly
                        />
                    </div>
                    <div class="mt-6">
                        <select class="select select-bordered w-full max-w-xs" required name="psId">
                            <option value=""></option>
                            <option v-for="ps in pss" :key="ps._id" :value="ps._id">
                                {{ ps.name }}
                            </option>
                        </select>
                    </div>

                    <div class="mt-6">
                        <select
                            class="select select-bordered w-full max-w-xs"
                            required
                            name="runnerId"
                            ref="numberInput"
                        >
                            <option value=""></option>
                            <option v-for="runner in runners" :key="runner._id" :value="runner._id">
                                {{ runner.number }}
                            </option>
                        </select>
                    </div>

                    <div class="mt-6 w-full">
                        <button class="btn btn-primary" type="submit">Assegna</button>
                    </div>
                </form>
            </X200Widget>
        </template>

        <!-- MODALS OR THINGS -->
        <template #after>
            <Teleport to="#modals">
                <X300ModalConfirm
                    :title="_t('Remove Take')"
                    :description="_t('Are you sure to delete the Take?')"
                    ok-label="Delete"
                    :isRevealed="isTakeDelRevealed"
                    @close="(cont) => confirmTakeDel(cont)"
                />
                <X300ModalConfirm
                    :title="_t('Remove Time')"
                    :description="_t('Are you sure to delete the Time?')"
                    ok-label="Delete"
                    :isRevealed="isTimeDelRevealed"
                    @close="(cont) => confirmTimeDel(cont)"
                />
            </Teleport>
        </template>
    </L002MainInternal>
</template>

<style></style>
