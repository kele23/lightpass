<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { IDItem } from '../../types/iditem.ts';
import { useLightpassSensor } from '../composable/useLightpassSensor.ts';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
const { deviceTimes, loadTimes } = useLightpassSensor();

onMounted(() => {
  loadTimes();
});

const data = computed(() => {
  return deviceTimes.value
    ?.map(
      (item) =>
        ({
          _id: '' + item,
          date: item,
        }) as IDItem,
    )
    .reverse();
});
</script>

<template>
  <L002MainInternal>
    <template #content>
      <X001Table
        v-if="data"
        ref="table"
        :data="data"
        :actionDisabled="true"
        :labels="['Date']"
        :keys="['date']"
        :format="['datems']"
      />
    </template>
  </L002MainInternal>
</template>
