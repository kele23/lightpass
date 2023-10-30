<script setup lang="ts">
import { useGlobalScore } from '../composable/useGlobalScore';
import { _t } from '../services/dictionary';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X201WidgetDownloadCsv from './X201WidgetDownloadCsv.vue';

const { globalScore } = useGlobalScore();
</script>

<template>
    <L002MainInternal>
        <template #content>
            <h1 class="mb-6">
                <b class="text-3xl">{{ _t('Global Score') }}</b>
            </h1>
            <X001Table
                :data="globalScore"
                :show-pos="true"
                :actionDisabled="true"
                :labels="['Number', 'Name', 'Diff']"
                :keys="['number', 'name', 'diff']"
                :format="['string', 'string', 'diff']"
            />
        </template>
        <template #sidebar>
            <X201WidgetDownloadCsv :data="globalScore" />
        </template>
    </L002MainInternal>
</template>
