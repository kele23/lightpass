<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDB } from '../composable/useDB';
import { IDItem } from '../interfaces/db';
import X001Table from './X001Table.vue';
import X200Widget from './X200Widget.vue';

/////////////////////////////////////////////////////
const {
    db,
    id,
    p2pConnected,
    p2pConnectTo,
    p2pDoPull,
    p2pDoPush,
    p2pDoSync,
    clientDoPull,
    clientDoPush,
    clientDoSync,
} = useDB();

const peerInput = ref<HTMLInputElement>();
const change = ref(1);
const rows = ref([] as IDItem[]);

watch(
    [change],
    async () => {
        const iterator = db.iterator({ valueEncoding: 'utf-8' });
        const tmp = [] as IDItem[];
        for await (const [key, value] of iterator) {
            if (key.indexOf('binary') >= 0) continue;

            const row = {
                _id: key,
                value,
            } as IDItem;

            tmp.push(row);
        }
        return (rows.value = tmp);
    },
    { immediate: true }
);
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
            <X200Widget v-if="!p2pConnected">
                <div>P2P</div>
                <div>
                    {{ id }}
                </div>
                <div class="w-full">
                    <input
                        ref="peerInput"
                        type="text"
                        class="input-bordered input w-full max-w-xs"
                        placeholder="Other PEER ID"
                        name="otherPeer"
                    />
                </div>
                <div class="mt-4 w-full">
                    <button class="btn-primary btn" type="button" @click="p2pConnectTo(peerInput?.value!)">
                        Connect
                    </button>
                </div>
            </X200Widget>
            <X200Widget v-if="p2pConnected">
                <div>P2P</div>
                <button class="btn-primary btn mr-4" type="button" @click="p2pDoPull">PULL</button>
                <button class="btn-primary btn mr-4" type="button" @click="p2pDoPush">PUSH</button>
                <button class="btn-primary btn" type="button" @click="p2pDoSync">SYNC</button>
            </X200Widget>
            <X200Widget>
                <div>Client</div>
                <button class="btn-primary btn mr-4" type="button" @click="clientDoPull">PULL</button>
                <button class="btn-primary btn mr-4" type="button" @click="clientDoPush">PUSH</button>
                <button class="btn-primary btn" type="button" @click="clientDoSync">SYNC</button>
            </X200Widget>
        </div>
    </div>
</template>
