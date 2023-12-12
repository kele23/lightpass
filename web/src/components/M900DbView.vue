<script setup lang="ts">
import { IDItem } from '../interfaces/db.js';
import X001Table from './X001Table.vue';

/////////////////////////////////////////////////////
import { SyncHttpClient } from '@kele23/levelshare-httpclient';
import { SyncP2PPeerJS } from '@kele23/levelshare-peerjs';
import { ref, shallowRef, watch } from 'vue';
import { db } from '../services/db.js';
import X200Widget from './X200Widget.vue';

const rows = shallowRef();
const httpClient = new SyncHttpClient(db, 'http://localk:3000');
const p2pClient = new SyncP2PPeerJS(db);

const p2pInput = ref<HTMLInputElement | null>(null);

const reset = ref(1);

watch(
    [reset],
    async () => {
        const iterator = db.iterator({ keyEncoding: 'utf-8', valueEncoding: 'utf-8' });
        const tmp = [] as IDItem[];
        for await (const [key, value] of iterator) {
            const row = {
                _id: key,
                value,
            } as IDItem;
            tmp.push(row);
        }
        rows.value = tmp;
    },
    { immediate: true }
);

const sync = async () => {
    await httpClient.sync();
    reset.value++;
};

const syncP2P = async () => {
    const id = p2pInput.value?.value;
    if (!id) return;
    await p2pClient.sync({ peerId: id, continuous: false, iterval: 0 });
    reset.value++;
};
</script>

<template>
    <div class="container mx-auto my-4">
        <h1 class="my-10 text-3xl font-bold">DB VIEW</h1>

        <div class="flex w-full flex-wrap">
            <X001Table
                v-if="rows"
                :data="rows"
                :labels="['Key', 'Value']"
                :keys="['_id', 'value']"
                @removeClick="(_id) => db.del(_id)"
            />
        </div>

        <div class="flex gap-4">
            <X200Widget>
                <div>Sync HTTP</div>
                <button class="btn-primary btn mr-4 mt-4" type="button" @click="sync">Sync</button>
            </X200Widget>
            <X200Widget>
                <div>Sync P2P</div>
                <input
                    type="text"
                    placeholder="Insert other peer id"
                    class="input-bordered input mt-4 w-full max-w-xs"
                    ref="p2pInput"
                />
                <button class="btn-primary btn mr-4 mt-4" type="button" @click="syncP2P">Sync</button>
            </X200Widget>
        </div>
    </div>
</template>
