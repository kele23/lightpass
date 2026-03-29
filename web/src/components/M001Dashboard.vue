<script setup lang="ts">
import { BackspaceIcon } from '@heroicons/vue/24/solid';
import { useConfirmDialog } from '@vueuse/core';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDashboard } from '../composable/useDashboard.ts';
import { usePS } from '../composable/usePS.ts';
import { useRace } from '../composable/useRace.ts';
import { useRunners } from '../composable/useRunners.ts';
import { useTimes } from '../composable/useTimes.ts';
import { FriendlyTake, PS, TakeType } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import useToasterStore from '../stores/toaster.ts';
import { jsonToForm } from '../utils/form-to-json.ts';
import { datems } from '../utils/formats.ts';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X200Widget from './X200Widget.vue';
import X300ModalConfirm from './X300ModalConfirm.vue';

const toasterStore = useToasterStore();
const { currentRace } = useRace();
const { removeTime } = useTimes();
const { pss } = usePS();
const { runners } = useRunners();
const selectedPs = ref<PS>();
const type = ref<TakeType>();
const { times, score, takes, addTake, updateTake, removeTake } = useDashboard(selectedPs, type);
const numberInput = ref<HTMLElement>();
const route = useRoute();

const { isRevealed: isTakeDelRevealed, reveal: revealTakeDel, confirm: confirmTakeDel } = useConfirmDialog();
const { isRevealed: isTimeDelRevealed, reveal: revealTimeDel, confirm: confirmTimeDel } = useConfirmDialog();
const { isRevealed: isPenRevealed, reveal: revealPen, confirm: confirmPen } = useConfirmDialog();

const selectedTake = ref<FriendlyTake>();
const penInput = ref<number>(0);

const assignTime = ref<HTMLFormElement>();

function changePs(event: Event) {
  selectedPs.value = pss.value.find((item) => item._id == (event.target as HTMLInputElement)?.value);
}

watch(
  [route],
  () => {
    type.value = route.meta.type as TakeType;
  },
  { immediate: true },
);

watch([type, selectedPs], () => {
  if (assignTime.value) {
    assignTime.value.reset();
    onReset();
  }
});

watch(times, (newTimes, oldTimes) => {
  if (newTimes && oldTimes && newTimes.length > oldTimes.length) {
    const newTime = newTimes.find((nt) => !oldTimes.some((ot) => ot._id === nt._id));
    if (newTime && assignTime.value) {
      const formData = new FormData(assignTime.value);
      if (!formData.get('timeId') && !formData.get('runnerNumber')) {
        populateAssign(newTime._id);
      }
    }
  }
});

async function populateAssign(_id: string) {
  if (!assignTime.value) return;

  const timeId = _id;
  const raceId = currentRace.value?._id;
  const psId = selectedPs.value?._id;

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
  if (!formData.get('timeId')) {
    toasterStore.error({ text: _t('Time not selected') });
    return;
  }

  const runnerId = runners.value.find((item) => item.number == parseInt(formData.get('runnerNumber')!.toString()))?._id;
  if (!runnerId) {
    toasterStore.error({ text: _t('Runner not exists or not selected') });
    return;
  }

  const psId = formData.get('psId')!.toString();
  if (!psId) {
    toasterStore.error({ text: _t('PS not selected') });
    return;
  }

  try {
    await addTake(
      {
        time: parseInt(formData.get('timeNum')!.toString()),
        ps: psId,
        runner: runnerId,
        type: parseInt(formData.get('type')!.toString()) == TakeType.start ? TakeType.start : TakeType.end,
      },
      formData.get('timeId')!.toString(),
    );
    if (assignTime.value) {
      assignTime.value.reset();
      onReset();
    }
  } catch (e) {
    toasterStore.error({ text: _t('Take already exists') });
  }
}

function onReset() {
  if (assignTime.value) {
    const hiddenInputs = assignTime.value.querySelectorAll('input[type="hidden"]');
    hiddenInputs.forEach((input) => ((input as HTMLInputElement).value = ''));
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

const editTake = async (id: string) => {
  const take = takes.value.find((t) => t._id == id);
  if (!take) return;

  selectedTake.value = JSON.parse(JSON.stringify(take));
  penInput.value = (selectedTake.value?.pen || 0) / 1000;

  const { data, isCanceled } = await revealPen();
  if (!isCanceled && data) {
    if (selectedTake.value) {
      selectedTake.value.pen = Math.round(penInput.value * 1000);
      await updateTake(selectedTake.value);
      toasterStore.success({ text: _t('Penalty updated') });
    }
  }
};
</script>

<template>
  <L002MainInternal>
    <template #content>
      <h1 class="mb-6">
        <b class="text-3xl">{{ type == TakeType.start ? 'START' : 'FINISH' }}</b>
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
        :labels="['Runner', 'Time', 'Penalty', 'PS', 'Type']"
        :keys="['runnerNumber', 'time', 'pen', 'psName', 'type']"
        :editEnabled="true"
        :format="[
          'pIntBolder',
          'onlyTimeMs',
          'msToSec',
          'uppercase',
          (data: TakeType) => (data == TakeType.start ? 'START' : 'END'),
        ]"
        @removeClick="(_id) => delTake(_id)"
        @editClick="(_id) => editTake(_id)"
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
        <form ref="assignTime" @submit.prevent="submitTake($event as SubmitEvent)" @reset="onReset">
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
            <input
              type="number"
              class="input input-bordered w-full max-w-xs"
              required
              placeholder="Runner"
              name="runnerNumber"
              ref="numberInput"
            />
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
        <X300ModalConfirm :title="_t('Edit Penalty')" :isRevealed="isPenRevealed" @close="(cont) => confirmPen(cont)">
          <div class="space-y-4 pt-4">
            <div
              v-if="selectedTake"
              class="border-base-content/10 bg-base-200 flex items-center gap-4 rounded-xl border p-4"
            >
              <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content flex w-12 items-center justify-center rounded-full">
                  <span class="text-xl font-bold">{{ selectedTake.runnerNumber }}</span>
                </div>
              </div>
              <div>
                <div class="text-xs font-semibold uppercase opacity-50">{{ _t('Runner') }}</div>
                <div class="text-lg leading-tight font-bold">{{ selectedTake.runnerName }}</div>
                <div class="text-primary inline-flex items-center gap-1 text-xs font-bold">
                  <span class="badge badge-primary badge-xs"></span>
                  {{ selectedTake.psName }}
                </div>
              </div>
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-semibold uppercase opacity-60">{{ _t('Penalty (seconds)') }}</span>
              </label>
              <div class="join w-full">
                <input
                  v-model="penInput"
                  type="number"
                  step="0.1"
                  class="input join-item input-lg input-bordered w-full font-mono text-2xl"
                  placeholder="0.0"
                />
                <div class="join-item bg-base-300 flex items-center px-6 font-bold uppercase transition-colors">s</div>
              </div>
            </div>
          </div>
        </X300ModalConfirm>
      </Teleport>
    </template>
  </L002MainInternal>
</template>

<style></style>
