<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGlobalScore } from '../composable/useGlobalScore.ts';
import { _t } from '../services/dictionary.ts';
import { diff as formatDiffFn } from '../utils/formats.ts';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X201WidgetDownloadCsv from './X201WidgetDownloadCsv.vue';
import X202WidgetPrint from './X202WidgetPrint.vue';
import X203WidgetLive from './X203WidgetLive.vue';
import X204WidgetFilter from './X204WidgetFilter.vue';

const { score } = useGlobalScore();
const table = ref();

const selectedCategories = ref<string[]>([]);
const selectedTeams = ref<string[]>([]);
const isExtended = ref(false);

const labels = computed(() => {
  return isExtended.value
    ? ['POS', 'Number', 'Name', 'Cat', 'Team', 'Fci', 'Uci', 'Naz', 'Time']
    : ['POS', 'Number', 'Name', 'Cat', 'Team', 'Time'];
});

const keys = computed(() => {
  return isExtended.value
    ? ['pos', 'number', 'name', 'category', 'team', 'fci', 'uci', 'naz', 'diff']
    : ['pos', 'number', 'name', 'category', 'team', 'diff'];
});

const format = computed(() => {
  return isExtended.value
    ? ['pos', 'bolder', 'string', 'string', 'string', 'uppercase', 'uppercase', 'uppercase', formatDiff]
    : ['pos', 'bolder', 'string', 'string', 'string', formatDiff];
});

const filteredScore = computed(() => {
  let res = score.value || [];
  if (selectedCategories.value.length > 0) {
    res = res.filter((d: any) => selectedCategories.value.includes(d.category));
  }
  if (selectedTeams.value.length > 0) {
    res = res.filter((d: any) => selectedTeams.value.includes(d.team));
  }
  return res;
});

function formatDiff(data: any, item?: any): string {
  const diffStr = formatDiffFn(data);
  if (!diffStr) return '';
  if (item?.pen) {
    return `${diffStr} <span class="text-error ml-2 text-[0.8em] font-black tracking-widest whitespace-nowrap">(PEN +${(item.pen / 1000).toFixed(1)}s)</span>`;
  }
  return diffStr;
}
</script>

<template>
  <L002MainInternal>
    <template #content>
      <h1 class="mb-6" data-testid="global-score-title">
        <b class="text-3xl">{{ _t('Global Score') }}</b>
      </h1>
      <X001Table
        ref="table"
        :data="filteredScore"
        :show-pos="true"
        :compact="isExtended"
        :actionDisabled="true"
        :filterKey="['number', 'name']"
        :labels="labels"
        :keys="keys"
        :format="format"
        data-testid="global-score-table"
      />
    </template>
    <template #sidebar>
      <X203WidgetLive />
      <X204WidgetFilter :data="score" v-model:categories="selectedCategories" v-model:teams="selectedTeams" v-model:extended="isExtended" />
      <X202WidgetPrint :table="table?.tableEl" />
      <X201WidgetDownloadCsv :data="filteredScore" filename="global_score" />
    </template>
  </L002MainInternal>
</template>
