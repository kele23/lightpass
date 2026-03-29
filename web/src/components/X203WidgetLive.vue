<script setup lang="ts">
import { useRouter } from 'vue-router';
import X200Widget from './X200Widget.vue';
import { _t } from '../services/dictionary.ts';

const props = defineProps<{
  ps?: string;
}>();

const router = useRouter();

function goToLive() {
  if (props.ps) {
    router.push({ name: 'live-results', params: { ps: props.ps } });
  } else {
    router.push({ name: 'live-results' });
  }
}
</script>
<template>
  <X200Widget>
    <button class="btn-secondary btn w-full" type="button" @click="goToLive">
      <span class="relative mr-2 flex h-3 w-3">
        <span class="bg-error absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
        <span class="bg-error relative inline-flex h-3 w-3 rounded-full"></span>
      </span>
      {{ _t('Live View') }}
    </button>
  </X200Widget>
</template>
