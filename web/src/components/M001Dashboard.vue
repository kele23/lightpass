<script setup lang="ts">
import { BackspaceIcon, FlagIcon, PlayIcon } from '@heroicons/vue/24/solid';
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

import { useLogin } from '../composable/useLogin.ts';

const { isReadOnly } = useLogin();
const toasterStore = useToasterStore();
const { currentRace } = useRace();
const { removeTime } = useTimes();
const { pss } = usePS();
const { runners } = useRunners();
const selectedPs = ref<PS>();
const type = ref<TakeType>();
const startOffset = ref(-5);
const { times, score, takes, addTake, updateTake, removeTake, hasMorePrevious } = useDashboard(selectedPs, type, startOffset);
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

async function submitRetired(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);
  const runnerNumberStr = formData.get('runnerNumber')?.toString();
  if (!runnerNumberStr) {
    toasterStore.error({ text: _t('Runner not found') });
    return;
  }
  const runner = runners.value.find((item) => item.number == parseInt(runnerNumberStr));
  if (!runner) {
    toasterStore.error({ text: _t('Runner not found') });
    return;
  }
  const psId = selectedPs.value?._id;
  if (!psId) {
    toasterStore.error({ text: _t('PS not selected') });
    return;
  }

  try {
    await addTake({
      ps: psId,
      runner: runner._id!,
      type: TakeType.retired,
    });
    form.reset();
  } catch (e) {
    toasterStore.error({ text: _t('Error') });
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

function formatNumberWithStatus(val: any, item?: any) {
  let color = 'bg-gray-400';
  let extraClass = '';
  if (item?.status === 'assigned') color = 'bg-success';
  else if (item?.status === 'missing') color = 'bg-warning';
  else if (item?.status === 'waiting') color = 'bg-info';
  else if (item?.status === 'retired') {
    color = 'bg-error';
    extraClass = 'line-through opacity-50';
  }

  return `<div class="flex items-center gap-2"><div class="w-3 h-3 shrink-0 rounded-full ${color}"></div><b class="${extraClass}">${val}</b></div>`;
}
</script>

<template>
  <L002MainInternal>
    <template #content>
      <div class="mb-4 flex items-center gap-3 rounded-xl border-l-4 p-3 bg-base-200 shadow-sm"
           :class="type == TakeType.start ? 'border-info text-info' : 'border-success text-success'"
           data-testid="dashboard-title">
        <component :is="type == TakeType.start ? PlayIcon : FlagIcon" class="h-8 w-8" />
        <h1 class="text-2xl font-bold uppercase tracking-wider">
          {{ type == TakeType.start ? _t('Start') : _t('Finish') }}
        </h1>
      </div>

      <X001Table
        :data="times"
        :title="_t('Passages')"
        :labels="['Passages']"
        :keys="['time']"
        :editEnabled="true"
        :format="['datems']"
        @removeClick="(_id) => delTime(_id)"
        @editClick="(_id) => populateAssign(_id)"
        data-testid="passages-table"
      />

      <X001Table
        v-if="selectedPs"
        :data="score"
        :title="_t('Partial score')"
        :actionDisabled="true"
        :hideCount="true"
        :labels="['Number', 'Name', 'Start', 'End', 'Time', 'Pos']"
        :keys="['number', 'name', 'start', 'end', 'diff', 'pos']"
        :format="[
          (val, item) => formatNumberWithStatus(val, item),
          'string',
          'onlyTimeMs',
          'onlyTimeMs',
          'diff',
          'pos',
        ]"
        data-testid="partial-score-table"
      />

      <div v-if="selectedPs && (hasMorePrevious || startOffset < -5)" class="flex justify-center mb-6 mt-2">
        <button class="btn btn-sm btn-outline" @click="startOffset = startOffset === -5 ? -1000 : -5" data-testid="show-previous-button">
          {{ startOffset === -5 ? _t('Show previous') : _t('Hide previous') }}
        </button>
      </div>

      <X001Table
        :title="_t('Takes')"
        :data="takes"
        :labels="['Runner', 'Name', 'Time', 'Penalty', 'PS', 'Type']"
        :keys="['runnerNumber', 'runnerName', 'time', 'pen', 'psName', 'type']"
        :editEnabled="true"
        :format="[
          'pIntBolder',
          'string',
          'onlyTimeMs',
          'msToSec',
          'uppercase',
          (data: TakeType) => (data == TakeType.start ? 'START' : data == TakeType.end ? 'END' : 'RETIRED'),
        ]"
        @removeClick="(_id) => delTake(_id)"
        @editClick="(_id) => editTake(_id)"
        data-testid="takes-table"
      />
    </template>
    <template #sidebar>
      <X200Widget>
        <div class="form-control w-full max-w-xs">
          <label class="label">
            <span class="label-text">{{ _t('Select PS') }}</span>
          </label>
          <select class="select select-bordered w-full max-w-xs" @change="changePs" data-testid="select-ps-input">
            <option value="">{{ _t('All PS') }}</option>
            <option v-for="ps in pss" :key="ps._id" :value="ps._id" :selected="ps._id == selectedPs?._id">
              {{ ps.name }}
            </option>
          </select>
        </div>
      </X200Widget>
      <X200Widget v-if="!isReadOnly">
        <form ref="assignTime" @submit.prevent="submitTake($event as SubmitEvent)" @reset="onReset" data-testid="assign-time-form">
          <div class="flex items-center justify-between">
            <span class="font-bold"> {{ _t('Assign') }} </span>
            <button class="btn" title="Clear" type="reset" data-testid="assign-time-reset">
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
              data-testid="assign-time-display"
            />
          </div>
          <div class="mt-6">
            <select class="select select-bordered w-full max-w-xs" required name="psId" data-testid="assign-ps-select">
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
              data-testid="assign-runner-input"
            />
          </div>

          <div class="mt-6 w-full">
            <button class="btn btn-primary w-full" type="submit" data-testid="assign-submit">Assegna</button>
          </div>
        </form>
      </X200Widget>

      <X200Widget v-if="selectedPs && !isReadOnly">
        <form @submit.prevent="submitRetired($event as SubmitEvent)" data-testid="retired-runner-form">
          <div class="flex items-center justify-between">
            <span class="font-bold"> {{ _t('Runner Retired') }} </span>
          </div>

          <div class="mt-6">
            <input
              type="number"
              class="input input-bordered w-full max-w-xs"
              required
              placeholder="Runner"
              name="runnerNumber"
              data-testid="retired-runner-input"
            />
          </div>

          <div class="mt-6 w-full">
            <button class="btn btn-error w-full" type="submit" data-testid="retired-runner-submit">Ritirato</button>
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
                  data-testid="penalty-input"
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
