<script setup lang="ts">
// import { useRouteParams } from '@vueuse/router';
import { ref, watch } from 'vue';
// import { useRace } from '../composable/useRace.ts';
import { useRouteParams } from '@vueuse/router';
import { usePS } from '../composable/usePS.ts';
import { useScore } from '../composable/useScore.ts';
import { PS } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X201WidgetDownloadCsv from './X201WidgetDownloadCsv.vue';
import X202WidgetPrint from './X202WidgetPrint.vue';

const selectedPS = ref<PS>();
const psParam = useRouteParams('ps');
const { pss } = usePS();
const { score } = useScore(selectedPS);
const table = ref();

watch(
    [pss, psParam],
    () => {
        selectedPS.value = pss.value.find((item) => item._id == psParam.value);
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
                ref="table"
                :data="score"
                :show-pos="true"
                :actionDisabled="true"
                :filterKey="['number', 'name']"
                :labels="['Pos', 'Number', 'Name', 'Cat', 'Team', 'Start', 'End', 'Diff']"
                :keys="['pos', 'number', 'name', 'category', 'team', 'start', 'end', 'diff']"
                :format="['pos', 'bolder', 'string', 'string', 'string', 'onlyTimeMs', 'onlyTimeMs', 'diff']"
            />
        </template>
        <template #sidebar>
            <X202WidgetPrint :table="table?.tableEl" />
            <X201WidgetDownloadCsv :data="score" />
        </template>
    </L002MainInternal>
</template>
