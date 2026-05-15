<script setup lang="ts">
// import { useRouteParams } from '@vueuse/router';
import { ref, watch, computed } from 'vue';
// import { useRace } from '../composable/useRace.ts';
import { useRouteParams } from '@vueuse/router';
import { parse } from 'papaparse';
import { usePS } from '../composable/usePS.ts';
import { useScore } from '../composable/useScore.ts';
import { useTakes } from '../composable/useTakes.ts';
import { useRunners } from '../composable/useRunners.ts';
import { useLogin } from '../composable/useLogin.ts';
import { PS, TakeType } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import { diff as formatDiffFn } from '../utils/formats.ts';
import { readFileAsync } from '../utils/files.ts';
import { BackspaceIcon } from '@heroicons/vue/24/solid';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X200Widget from './X200Widget.vue';
import X201WidgetDownloadCsv from './X201WidgetDownloadCsv.vue';
import X202WidgetPrint from './X202WidgetPrint.vue';
import X203WidgetLive from './X203WidgetLive.vue';

import X204WidgetFilter from './X204WidgetFilter.vue';

const selectedPS = ref<PS>();
const psParam = useRouteParams('ps');
const { pss } = usePS();
const { score } = useScore(selectedPS);
const { takes, addTake, removeTake } = useTakes();
const { runners } = useRunners();
const { isReadOnly } = useLogin();
const table = ref();

const selectedCategories = ref<string[]>([]);
const selectedTeams = ref<string[]>([]);
const isExtended = ref(false);

const labels = computed(() => {
  return isExtended.value
    ? ['Pos', 'Number', 'Name', 'Cat', 'Team', 'Fci', 'Uci', 'Naz', 'Start', 'End', 'Time']
    : ['Pos', 'Number', 'Name', 'Cat', 'Team', 'Start', 'End', 'Time'];
});

const keys = computed(() => {
  return isExtended.value
    ? ['pos', 'number', 'name', 'category', 'team', 'fci', 'uci', 'naz', 'start', 'end', 'diff']
    : ['pos', 'number', 'name', 'category', 'team', 'start', 'end', 'diff'];
});

const format = computed(() => {
  return isExtended.value
    ? [
        'pos',
        'bolder',
        'string',
        'string',
        'string',
        'uppercase',
        'uppercase',
        'uppercase',
        'onlyTimeMs',
        'onlyTimeMs',
        formatDiff,
      ]
    : ['pos', 'bolder', 'string', 'string', 'string', 'onlyTimeMs', 'onlyTimeMs', formatDiff];
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

watch(
  [pss, psParam],
  () => {
    selectedPS.value = pss.value.find((item) => item._id == psParam.value);
  },
  { immediate: true },
);

function formatDiff(data: any, item?: any): string {
  const diffStr = formatDiffFn(data);
  if (!diffStr) return '';
  if (item?.pen) {
    return `${diffStr} <span class="text-error ml-2 text-[0.8em] font-black tracking-widest whitespace-nowrap">(PEN +${(item.pen / 1000).toFixed(1)}s)</span>`;
  }
  return diffStr;
}

async function uploadCsv(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement;
  const files = (form.querySelector('[type=file]') as HTMLInputElement).files;
  if (!files || files.length === 0) return;
  if (!selectedPS.value) return;

  const f = files[0];
  const arrayBuffer = (await readFileAsync(f)) as ArrayBuffer;
  const decoder = new TextDecoder('utf-8');
  const csv = decoder.decode(arrayBuffer);

  const results = parse(csv, { header: true });
  const rows = results.data as any[];

  for (const row of rows) {
    if (!row.number) continue;
    const runner = runners.value.find((r) => r.number == parseInt(row.number));
    if (!runner) continue;

    if (!row.end || parseInt(row.end) <= 0) continue;

    if (row.start && parseInt(row.start) > 0) {
      const existingStartTake = takes.value.find(
        (t) => t.ps === selectedPS.value!._id && t.runner === runner._id && t.type === TakeType.start,
      );
      if (existingStartTake) await removeTake(existingStartTake._id);

      try {
        await addTake({
          runner: runner._id,
          ps: selectedPS.value._id,
          type: TakeType.start,
          time: parseInt(row.start),
        });
      } catch (e) {
        console.info(e);
      }
    }

    if (row.end && parseInt(row.end) > 0) {
      const existingEndTake = takes.value.find(
        (t) => t.ps === selectedPS.value!._id && t.runner === runner._id && t.type === TakeType.end,
      );
      if (existingEndTake) await removeTake(existingEndTake._id);

      try {
        await addTake({
          runner: runner._id,
          ps: selectedPS.value._id,
          type: TakeType.end,
          time: parseInt(row.end),
          pen: row.pen ? parseInt(row.pen) : undefined,
        });
      } catch (e) {
        console.info(e);
      }
    }
  }
  form.reset();
}
</script>

<template>
  <L002MainInternal>
    <template #content>
      <h1 class="mb-6" data-testid="score-title">
        <b class="text-3xl">{{ _t('Score') }} {{ selectedPS?.name }}</b>
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
        data-testid="score-table"
      />
    </template>
    <template #sidebar>
      <X203WidgetLive :ps="selectedPS?._id" />
      <X204WidgetFilter
        :data="score"
        v-model:categories="selectedCategories"
        v-model:teams="selectedTeams"
        v-model:extended="isExtended"
      />

      <X202WidgetPrint :table="table?.tableEl" />

      <X200Widget v-if="!isReadOnly">
        <form @submit.prevent="uploadCsv($event as SubmitEvent)" data-testid="upload-scores-form">
          <div class="flex items-center justify-between">
            <span class="font-bold"> {{ _t('Upload Scores') }} </span>
            <button class="btn" title="Clear" type="reset" data-testid="upload-scores-reset">
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
              data-testid="upload-scores-file"
            />
          </div>

          <div class="mt-6 w-full">
            <button class="btn-primary btn" type="submit" data-testid="upload-scores-submit">Carica</button>
          </div>
        </form>
      </X200Widget>
      <X201WidgetDownloadCsv :data="filteredScore" :filename="`score_${selectedPS?.name || 'ps'}`" />
    </template>
  </L002MainInternal>
</template>
