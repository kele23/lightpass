<script setup lang="ts">
// @ts-ignore
import Papa from 'papaparse';
import { IDItem } from '../../types/iditem.ts';
import X200Widget from './X200Widget.vue';

const props = defineProps<{
  data: IDItem[];
}>();

async function downloadCsv() {
  const csv = Papa.unparse(props.data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>
<template>
  <X200Widget>
    <button class="btn-primary btn" type="button" @click="downloadCsv">Scarica CSV</button>
  </X200Widget>
</template>
