<script setup lang="ts">
import { ref } from 'vue';
import { useGlobalScore } from '../composable/useGlobalScore.ts';
import { _t } from '../services/dictionary.ts';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X201WidgetDownloadCsv from './X201WidgetDownloadCsv.vue';
import X202WidgetPrint from './X202WidgetPrint.vue';

const { globalScore } = useGlobalScore();
const table = ref();
</script>

<template>
    <L002MainInternal>
        <template #content>
            <h1 class="mb-6">
                <b class="text-3xl">{{ _t('Global Score') }}</b>
            </h1>
            <X001Table
                ref="table"
                :data="globalScore"
                :show-pos="true"
                :actionDisabled="true"
                :filterKey="['number', 'name']"
                :labels="['POS', 'Number', 'Name', 'Cat', 'Team', 'Diff']"
                :keys="['pos', 'number', 'name', 'category', 'team', 'diff']"
                :format="['pos', 'bolder', 'string', 'string', 'string', 'diff']"
            />
        </template>
        <template #sidebar>
            <X202WidgetPrint :table="table?.tableEl" />
            <X201WidgetDownloadCsv :data="globalScore" />
        </template>
    </L002MainInternal>
</template>
