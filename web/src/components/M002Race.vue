<script setup lang="ts">
import { BackspaceIcon } from '@heroicons/vue/24/solid';
import { useConfirmDialog } from '@vueuse/core';
// @ts-ignore
import { parse } from 'papaparse';
import { usePS } from '../composable/usePS';
import { Order, PS } from '../interfaces/db';
import { _t } from '../services/dictionary';
import { readFileAsync } from '../utils/files';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X201WidgetDownloadCsv from './X201WidgetDownloadCsv.vue';
import X300ModalConfirm from './X300ModalConfirm.vue';

/////////////////////////////////////////////////////
const { pss, addPS, removePS, cleanPS } = usePS();
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
    await cleanPS();
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
                :format="['string', 'string', 'date', (data: any) =>  data == Order.asc ? 'ASC' : 'DSC']"
                @removeClick="removePSDialog"
            />
        </template>
        <template #sidebar>
            <form
                class="w-80 rounded-lg bg-base-200 shadow transition-colors"
                @submit.prevent="createPS($event as SubmitEvent)"
            >
                <div class="px-6 py-4">
                    <div class="relative mt-6">
                        <div class="relative flex items-center justify-between text-base font-semibold leading-5">
                            <span class=""> Nuova PS </span>
                            <button class="btn" title="Clear" type="reset">
                                <BackspaceIcon class="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div class="mt-6">
                        <div class="w-full space-y-6">
                            <div class="w-full">
                                <div class="relative">
                                    <input
                                        type="text"
                                        class="input-bordered input w-full max-w-xs"
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
                                        class="input-bordered input w-full max-w-xs"
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
                                        class="input-bordered input w-full max-w-xs"
                                        placeholder="Gap"
                                        required
                                        name="gap"
                                        pattern="[0-9]+"
                                    />
                                </div>
                            </div>
                            <div class="w-full">
                                <div class="relative">
                                    <select class="select-bordered select w-full max-w-xs" name="order" required>
                                        <option value="asc">Crescente</option>
                                        <option value="desc">Decrescente</option>
                                    </select>
                                </div>
                            </div>
                            <div class="w-full">
                                <button class="btn-primary btn" type="submit">Crea</button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <form
                class="w-80 rounded-lg bg-base-200 shadow transition-colors"
                @submit.prevent="uploadCsv($event as SubmitEvent)"
            >
                <div class="px-6 py-4">
                    <div class="relative mt-6">
                        <div class="relative flex items-center justify-between text-base font-semibold leading-5">
                            <span class=""> Carica PS </span>
                            <button class="btn" title="Clear" type="reset">
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
                                        class="file-input-bordered file-input w-full max-w-xs"
                                        placeholder="File"
                                        required
                                        name="file"
                                    />
                                </div>
                            </div>
                            <div class="w-full">
                                <button class="btn-primary btn" type="submit">Carica</button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

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
