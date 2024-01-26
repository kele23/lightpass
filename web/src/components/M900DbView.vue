<script setup lang="ts">
import { IDItem } from '../interfaces/db.js';
import X001Table from './X001Table.vue';

/////////////////////////////////////////////////////
import { ref, shallowRef, watch } from 'vue';
import { db } from '../services/db.js';

const rows = shallowRef();
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
    </div>
</template>
