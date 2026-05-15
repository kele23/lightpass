<script setup lang="ts">
import { BackspaceIcon } from '@heroicons/vue/24/solid';
import { useConfirmDialog } from '@vueuse/core';
// @ts-ignore
import { parse } from 'papaparse';
import { usePS } from '../composable/usePS.ts';
import { PS } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import { readFileAsync } from '../utils/files.ts';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X200Widget from './X200Widget.vue';
import X201WidgetDownloadCsv from './X201WidgetDownloadCsv.vue';
import X300ModalConfirm from './X300ModalConfirm.vue';
import { ref, computed } from 'vue';
import { useLogin } from '../composable/useLogin.ts';

const { isReadOnly } = useLogin();

/////////////////////////////////////////////////////
const { pss, addPS, removePS, cleanPSs, updatePS } = usePS();
const { isRevealed, reveal, confirm } = useConfirmDialog();

const removePSDialog = async (id: string) => {
  const { data, isCanceled } = await reveal();
  if (!isCanceled && data) {
    removePS(id);
  }
};

const selectedPSForStartsId = ref<string>();
const customStartsModalOpen = ref(false);

const selectedPSForStarts = computed(() => {
  return pss.value.find((item) => item._id === selectedPSForStartsId.value);
});

const openPSCustomStarts = (id: string) => {
  selectedPSForStartsId.value = id;
  customStartsModalOpen.value = true;
};

const closeCustomStarts = () => {
  customStartsModalOpen.value = false;
  selectedPSForStartsId.value = undefined;
};

const addCustomStart = async (event: SubmitEvent) => {
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);
  const runner = parseInt(formData.get('runner') as string);
  const timeStr = formData.get('time') as string;
  
  if (selectedPSForStarts.value) {
    const time = new Date(timeStr).getTime();
    const updatedPS = { ...selectedPSForStarts.value };
    if (!updatedPS.customStarts) {
      updatedPS.customStarts = [];
    }
    
    const existingIndex = updatedPS.customStarts.findIndex((cs) => cs.runner === runner);
    if (existingIndex >= 0) {
      updatedPS.customStarts[existingIndex].time = time;
    } else {
      updatedPS.customStarts.push({ runner, time });
    }
    
    await updatePS(updatedPS);
    form.reset();
  }
};

const removeCustomStart = async (runner: number) => {
  if (selectedPSForStarts.value) {
    const updatedPS = { ...selectedPSForStarts.value };
    updatedPS.customStarts = updatedPS.customStarts?.filter((cs) => cs.runner !== runner);
    await updatePS(updatedPS);
  }
};

async function createPS(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);
  const obj = Object.fromEntries(formData);
  const data = { ...obj, start: new Date(obj.start as string).getTime(), gap: parseInt(obj.gap as string) } as PS;
  try {
    await addPS(data);
    form.reset();
  } catch (e) {
    console.info(e);
  }
}

async function uploadCsv(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement;
  const files = (form.querySelector('[type=file]') as HTMLInputElement).files;
  if (!files) return;
  //clean
  //await dbManager.cleanTakes(raceId);
  await cleanPSs();
  //read file
  const f = files[0];
  const arrayBuffer = (await readFileAsync(f)) as ArrayBuffer;
  const decoder = new TextDecoder('utf-8');
  const csv = decoder.decode(arrayBuffer);
  //read csv
  const results = parse(csv, {
    header: true,
  });
  //add item
  const rows = results.data as any[];
  for (const row of rows) {
    await addPS({
      ...row,
      start: parseInt(row.start),
      gap: parseInt(row.gap),
    });
  }
  //reset
  form.reset();
}
</script>

<template>
  <L002MainInternal>
    <template #content>
      <h1 class="mb-6" data-testid="race-title">
        <b class="text-3xl">{{ _t('Race') }}</b>
      </h1>
      <X001Table
        :data="pss"
        :labels="['Name', 'Gap', 'Start', 'Order', 'Custom Starts']"
        :keys="['name', 'gap', 'start', 'order', 'customStarts']"
        :format="['string', 'string', 'date', (data: any) => data, (data: any) => data?.length ? `${data.length}` : '-']"
        :editEnabled="!isReadOnly"
        @removeClick="removePSDialog"
        @editClick="openPSCustomStarts"
        data-testid="pss-table"
      />
    </template>
    <template #sidebar>
      <X200Widget v-if="!isReadOnly">
        <form @submit.prevent="createPS($event as SubmitEvent)" data-testid="new-ps-form">
          <div class="flex items-center justify-between">
            <span class="font-bold"> {{ _t('New PS') }} </span>
            <button class="btn" title="Clear" type="reset" data-testid="new-ps-reset">
              <BackspaceIcon class="h-6 w-6" />
            </button>
          </div>
          <div class="mt-6">
            <input type="text" class="input input-bordered w-full max-w-xs" required placeholder="Nome" name="name" data-testid="new-ps-name" />
          </div>
          <div class="mt-6">
            <input
              type="datetime-local"
              class="input input-bordered w-full max-w-xs"
              required
              placeholder="Start"
              name="start"
              data-testid="new-ps-start"
            />
          </div>
          <div class="mt-6">
            <input
              type="text"
              class="input input-bordered w-full max-w-xs"
              placeholder="Gap"
              required
              name="gap"
              pattern="[0-9]+"
              data-testid="new-ps-gap"
            />
          </div>
          <div class="mt-6">
            <select class="select select-bordered w-full max-w-xs" name="order" required data-testid="new-ps-order">
              <option value="asc">{{ _t('Asc') }}</option>
              <option value="desc">{{ _t('Desc') }}</option>
            </select>
          </div>

          <div class="mt-6 w-full">
            <button class="btn btn-primary" type="submit" data-testid="new-ps-submit">{{ _t('Create') }}</button>
          </div>
        </form>
      </X200Widget>

      <X200Widget v-if="!isReadOnly">
        <form @submit.prevent="uploadCsv($event as SubmitEvent)" data-testid="upload-race-form">
          <div class="flex items-center justify-between">
            <span class="font-bold"> {{ _t('Upload Race') }} </span>
            <button class="btn" title="Clear" type="reset" data-testid="upload-race-reset">
              <BackspaceIcon class="h-6 w-6" />
            </button>
          </div>
          <div class="mt-4 w-full space-y-6">
            <input
              type="file"
              class="file-input file-input-bordered w-full max-w-xs"
              placeholder="File"
              required
              name="file"
              data-testid="upload-race-file"
            />
          </div>
          <div class="mt-6 w-full">
            <button class="btn btn-primary" type="submit" data-testid="upload-race-submit">Carica</button>
          </div>
        </form>
      </X200Widget>

      <X201WidgetDownloadCsv :data="pss" filename="ps" />
    </template>

    <!-- MODALS OR THINGS -->
    <template #after>
      <Teleport to="#modals">
        <X300ModalConfirm
          :title="_t('Delete PS')"
          :description="_t('Are you sure to delete the PS?')"
          ok-label="Delete"
          :isRevealed="isRevealed"
          @close="(cont) => confirm(cont)"
        />

        <!-- Custom Starts Modal -->
        <dialog class="modal" :class="{ 'modal-open': customStartsModalOpen }">
          <div class="modal-box w-11/12 max-w-2xl bg-base-100">
            <h3 class="text-xl font-bold mb-4 border-b pb-2 flex justify-between items-center">
              <span>{{ _t('Custom Starts / Pauses') }} - {{ selectedPSForStarts?.name }}</span>
              <button class="btn btn-sm btn-circle btn-ghost" @click="closeCustomStarts">✕</button>
            </h3>

            <div class="space-y-6">
              <div v-if="!selectedPSForStarts?.customStarts?.length" class="text-center py-8 text-base-content/50 italic">
                {{ _t('No custom starts defined') }}
              </div>
              
              <div v-else class="overflow-x-auto border rounded-lg bg-base-200">
                <table class="table w-full">
                  <thead>
                    <tr>
                      <th>{{ _t('Runner') }}</th>
                      <th>{{ _t('Start Time') }}</th>
                      <th class="w-20 text-center">{{ _t('Actions') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="cs in selectedPSForStarts.customStarts" :key="cs.runner" class="hover:bg-base-300">
                      <td class="font-bold text-lg text-primary">{{ cs.runner }}</td>
                      <td class="font-mono text-lg">{{ new Date(cs.time).toLocaleString() }}</td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-error btn-square" @click="removeCustomStart(cs.runner)" title="Remove">
                          <BackspaceIcon class="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="bg-base-200 p-4 rounded-xl border">
                <h4 class="font-bold mb-4 uppercase text-sm tracking-wider opacity-60">{{ _t('Add / Edit Custom Start') }}</h4>
                <form @submit.prevent="addCustomStart($event as SubmitEvent)" class="flex flex-col md:flex-row gap-4 items-end">
                  <div class="form-control w-full">
                    <label class="label"><span class="label-text">{{ _t('Runner Number') }}</span></label>
                    <input type="number" name="runner" class="input input-bordered w-full" required min="1" />
                  </div>
                  <div class="form-control w-full">
                    <label class="label"><span class="label-text">{{ _t('New Start Time') }}</span></label>
                    <input type="datetime-local" step="1" name="time" class="input input-bordered w-full" required />
                  </div>
                  <div class="form-control w-full md:w-auto">
                    <button type="submit" class="btn btn-primary w-full">{{ _t('Save') }}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop" @submit="closeCustomStarts">
            <button>{{ _t('close') }}</button>
          </form>
        </dialog>
      </Teleport>
    </template>
  </L002MainInternal>
</template>
