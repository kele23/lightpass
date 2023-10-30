<script setup lang="ts">
import { useRouteParams } from '@vueuse/router';
import { ref, watch } from 'vue';
import { useRace } from '../composable/useRace';
import { useScore } from '../composable/useScore';
import { PS } from '../interfaces/db';
import { getPsLevel } from '../services/db';
import { _t } from '../services/dictionary';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X201WidgetDownloadCsv from './X201WidgetDownloadCsv.vue';

const { currentRace } = useRace();
const selectedPS = ref<PS>();
const psParam = useRouteParams('ps');
const { score } = useScore(selectedPS);

watch(
    [psParam, currentRace],
    async () => {
        if (!currentRace || !currentRace.value) return;
        const psLevel = getPsLevel(currentRace.value._id!);
        try {
            const _id = psParam.value as string;
            const ps = await psLevel.get(_id);
            selectedPS.value = { _id, ...ps };
        } catch (e) {
            selectedPS.value = undefined;
        }
    },
    { immediate: true }
);
</script>

<template>
    <L002MainInternal>
        <template #content>
            <h1 class="mb-6">
                <b class="text-3xl">{{ _t('Score') }} {{ selectedPS?.name }}</b>
            </h1>
            <X001Table
                :data="score"
                :show-pos="true"
                :actionDisabled="true"
                :labels="['Number', 'Name', 'Start', 'End', 'Diff']"
                :keys="['number', 'name', 'start', 'end', 'diff']"
                :format="['string', 'string', 'date', 'datems', 'diff']"
            />
        </template>
        <template #sidebar>
            <X201WidgetDownloadCsv :data="score" />
        </template>
    </L002MainInternal>
</template>
