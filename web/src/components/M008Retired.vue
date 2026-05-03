<script setup lang="ts">
import { useConfirmDialog } from '@vueuse/core';
import { ref } from 'vue';
import { useDashboard } from '../composable/useDashboard.ts';
import { usePS } from '../composable/usePS.ts';
import { PS, TakeType } from '../interfaces/db.ts';
import { _t } from '../services/dictionary.ts';
import L002MainInternal from './L002MainInternal.vue';
import X001Table from './X001Table.vue';
import X200Widget from './X200Widget.vue';
import X300ModalConfirm from './X300ModalConfirm.vue';

const { pss } = usePS();
const selectedPs = ref<PS>();
const type = ref<TakeType>(TakeType.retired);
const { takes, removeTake } = useDashboard(selectedPs, type);

const { isRevealed: isTakeDelRevealed, reveal: revealTakeDel, confirm: confirmTakeDel } = useConfirmDialog();
const delTakeId = ref<string>('');

function changePs(event: Event) {
  selectedPs.value = pss.value.find((item) => item._id == (event.target as HTMLInputElement)?.value);
}

const delTake = async (id: string) => {
  delTakeId.value = id;
  const { data, isCanceled } = await revealTakeDel();
  if (!isCanceled && data) {
    await removeTake(id);
  }
};

function confirmTakeDelHandler(cont: boolean) {
  confirmTakeDel(cont);
  if (!cont) delTakeId.value = '';
}
</script>

<template>
  <L002MainInternal>
    <template #content>
      <h1 class="mb-6" data-testid="retired-title">
        <b class="text-3xl">{{ _t('Runner Retired') }}</b>
      </h1>

      <X001Table
        :title="_t('Takes')"
        :data="takes"
        :labels="['Runner', 'Name', 'PS']"
        :keys="['runnerNumber', 'runnerName', 'psName']"
        :editEnabled="false"
        :format="['pIntBolder', 'string', 'uppercase']"
        @removeClick="(_id) => delTake(_id)"
        data-testid="retired-takes-table"
      />
    </template>
    <template #sidebar>
      <X200Widget>
        <div class="form-control w-full max-w-xs">
          <label class="label">
            <span class="label-text">{{ _t('Select PS') }}</span>
          </label>
          <select class="select select-bordered w-full max-w-xs" @change="changePs" data-testid="select-ps-input">
            <option value="">{{ _t('All PS') }}</option>
            <option v-for="ps in pss" :key="ps._id" :value="ps._id" :selected="ps._id == selectedPs?._id">
              {{ ps.name }}
            </option>
          </select>
        </div>
      </X200Widget>
    </template>

    <template #after>
      <Teleport to="#modals">
        <X300ModalConfirm
          :title="_t('Remove Take')"
          :description="_t('Are you sure to delete the Take?')"
          ok-label="Delete"
          :isRevealed="isTakeDelRevealed"
          @close="(cont) => confirmTakeDelHandler(cont)"
        />
      </Teleport>
    </template>
  </L002MainInternal>
</template>

<style></style>
