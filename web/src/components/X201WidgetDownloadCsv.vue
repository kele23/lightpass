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
  const csvContent = 'data:text/csv;charset=utf-8,' + csv;
  window.open(encodeURI(csvContent));
}
</script>
<template>
  <X200Widget>
    <button class="btn-primary btn" type="button" @click="downloadCsv">Scarica CSV</button>
  </X200Widget>
</template>
