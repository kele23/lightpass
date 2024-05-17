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

/////////////////////////////////////////////////////
const { pss, addPS, removePS, cleanPSs } = usePS();
const { isRevealed, reveal, confirm } = useConfirmDialog();

const removePSDialog = async (id: string) => {
    const { data, isCanceled } = await reveal();
    if (!isCanceled && data) {
        removePS(id);
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
            <h1 class="mb-6">
                <b class="text-3xl">{{ _t('Race') }}</b>
            </h1>
            <X001Table
                :data="pss"
                :labels="['Name', 'Gap', 'Start', 'Order']"
                :keys="['name', 'gap', 'start', 'order']"
                :format="['string', 'string', 'date', (data: any) =>  data]"
                @removeClick="removePSDialog"
            />
        </template>
        <template #sidebar>
            <X200Widget>
                <form @submit.prevent="createPS($event as SubmitEvent)">
                    <div class="flex items-center justify-between">
                        <span class="font-bold"> {{ _t('New PS') }} </span>
                        <button class="btn" title="Clear" type="reset">
                            <BackspaceIcon class="h-6 w-6" />
                        </button>
                    </div>
                    <div class="mt-6">
                        <input
                            type="text"
                            class="input input-bordered w-full max-w-xs"
                            required
                            placeholder="Nome"
                            name="name"
                        />
                    </div>
                    <div class="mt-6">
                        <input
                            type="datetime-local"
                            class="input input-bordered w-full max-w-xs"
                            required
                            placeholder="Start"
                            name="start"
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
                        />
                    </div>
                    <div class="mt-6">
                        <select class="select select-bordered w-full max-w-xs" name="order" required>
                            <option value="asc">{{ _t('Asc') }}</option>
                            <option value="desc">{{ _t('Desc') }}</option>
                            <option value="time">{{ _t('Time') }}</option>
                        </select>
                    </div>

                    <div class="mt-6 w-full">
                        <button class="btn btn-primary" type="submit">{{ _t('Create') }}</button>
                    </div>
                </form>
            </X200Widget>

            <X200Widget>
                <form @submit.prevent="uploadCsv($event as SubmitEvent)">
                    <div class="flex items-center justify-between">
                        <span class="font-bold"> {{ _t('Upload Race') }} </span>
                        <button class="btn" title="Clear" type="reset">
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
                        />
                    </div>
                    <div class="mt-6 w-full">
                        <button class="btn btn-primary" type="submit">Carica</button>
                    </div>
                </form>
            </X200Widget>

            <X201WidgetDownloadCsv :data="pss" />
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
            </Teleport>
        </template>
    </L002MainInternal>
</template>
