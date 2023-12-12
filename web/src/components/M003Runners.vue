<script setup lang="ts">
import { BackspaceIcon } from '@heroicons/vue/24/solid';
import { useConfirmDialog } from '@vueuse/core';
// @ts-ignore
import { parse } from 'papaparse';
import { useRunners } from '../composable/useRunners.ts';
import { Runner } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import { readFileAsync } from '../utils/files.ts';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X200Widget from './X200Widget.vue';
import X201WidgetDownloadCsv from './X201WidgetDownloadCsv.vue';
import X300ModalConfirm from './X300ModalConfirm.vue';

/////////////////////////////////////////////////////
const { runners, addRunner, removeRunner, cleanRunner } = useRunners();
const { isRevealed, reveal, confirm } = useConfirmDialog();

const removeRunnerDialog = async (id: string) => {
    const { data, isCanceled } = await reveal();
    if (!isCanceled && data) {
        removeRunner(id);
    }
};

async function createRunner(event: SubmitEvent) {
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const obj = Object.fromEntries(formData);
    const data = { ...obj } as unknown as Runner;
    await addRunner(data);
    form.reset();
}

async function uploadCsv(event: SubmitEvent) {
    const form = event.currentTarget as HTMLFormElement;
    const files = (form.querySelector('[type=file]') as HTMLInputElement).files;
    if (!files) return;
    //clean
    //await dbManager.cleanTakes(raceId);
    await cleanRunner();
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
    //add item
    const rows = results.data as object[];
    for (const row of rows) {
        await addRunner({
            ...row,
        } as Runner);
    }
    //reset
    form.reset();
}
</script>

<template>
    <L002MainInternal>
        <template #content>
            <h1 class="mb-6">
                <b class="text-3xl">{{ _t('Runners') }}</b>
            </h1>
            <X001Table
                :data="runners"
                :labels="['Num', 'Nome', 'Cat', 'Team', 'Fci', 'Uci', 'Soc', 'Naz']"
                :keys="['number', 'name', 'category', 'team', 'fci', 'uci', 'soc', 'naz']"
                @removeClick="removeRunnerDialog"
            />
        </template>
        <template #sidebar>
            <X200Widget>
                <form @submit.prevent="createRunner($event as SubmitEvent)">
                    <div class="flex items-center justify-between">
                        <span class="font-bold"> {{ _t('New Runner') }} </span>
                        <button class="btn" title="Clear" type="reset">
                            <BackspaceIcon class="h-6 w-6" />
                        </button>
                    </div>

                    <div class="mt-6">
                        <input
                            type="text"
                            class="input-bordered input w-full max-w-xs"
                            required
                            placeholder="Nome"
                            name="name"
                        />
                    </div>

                    <div class="mt-6">
                        <input
                            type="text"
                            class="input-bordered input w-full max-w-xs"
                            placeholder="Numero"
                            required
                            name="number"
                            pattern="[0-9]+"
                        />
                    </div>
                    <div class="mt-6">
                        <input
                            type="text"
                            class="input-bordered input w-full max-w-xs"
                            placeholder="Categoria"
                            required
                            name="category"
                        />
                    </div>
                    <div class="mt-6">
                        <input
                            type="text"
                            class="input-bordered input w-full max-w-xs"
                            required
                            placeholder="Team"
                            name="team"
                        />
                    </div>
                    <div class="mt-6">
                        <input
                            type="text"
                            class="input-bordered input w-full max-w-xs"
                            required
                            placeholder="Codice FCI"
                            name="fci"
                        />
                    </div>
                    <div class="mt-6">
                        <input
                            type="text"
                            class="input-bordered input w-full max-w-xs"
                            required
                            placeholder="Codice UCI"
                            name="uci"
                        />
                    </div>
                    <div class="mt-6">
                        <input
                            type="text"
                            class="input-bordered input w-full max-w-xs"
                            required
                            placeholder="Società"
                            name="soc"
                        />
                    </div>
                    <div class="mt-6">
                        <input
                            type="text"
                            class="input-bordered input w-full max-w-xs"
                            required
                            placeholder="Nazionalità"
                            name="naz"
                        />
                    </div>
                    <div class="mt-6 w-full">
                        <button class="btn-primary btn" type="submit">{{ _t('Create') }}</button>
                    </div>
                </form>
            </X200Widget>

            <X200Widget>
                <form @submit.prevent="uploadCsv($event as SubmitEvent)">
                    <div class="flex items-center justify-between">
                        <span class="font-bold"> {{ _t('Upload Runners') }} </span>
                        <button class="btn" title="Clear" type="reset">
                            <BackspaceIcon class="h-6 w-6" />
                        </button>
                    </div>

                    <div class="mt-4 w-full space-y-6">
                        <input
                            type="file"
                            class="file-input-bordered file-input w-full max-w-xs"
                            placeholder="File"
                            required
                            name="file"
                        />
                    </div>

                    <div class="mt-6 w-full">
                        <button class="btn-primary btn" type="submit">Carica</button>
                    </div>
                </form>
            </X200Widget>

            <X201WidgetDownloadCsv :data="runners" />
        </template>

        <!-- MODALS OR THINGS -->
        <template #after>
            <Teleport to="#modals">
                <X300ModalConfirm
                    :title="_t('Delete Runner')"
                    :description="_t('Are you sure to delete the Runner?')"
                    ok-label="Delete"
                    :isRevealed="isRevealed"
                    @close="(cont) => confirm(cont)"
                />
            </Teleport>
        </template>
    </L002MainInternal>
</template>
