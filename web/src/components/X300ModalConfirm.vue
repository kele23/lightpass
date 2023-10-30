<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { _t } from '../services/dictionary';
const modalRef = ref<HTMLDialogElement>();

const props = defineProps<{
    title: string;
    description?: string;
    cancelLabel?: string;
    okLabel?: string;
    isRevealed?: boolean;
}>();

const emit = defineEmits<{
    (e: 'close', cont: boolean): void;
}>();

useEventListener(modalRef, 'close', () => {
    emit('close', modalRef.value?.returnValue == 'continue');
});

const show = computed(() => props.isRevealed);
watch([show], () => {
    if (show.value === true) {
        modalRef.value?.showModal();
    } else {
        modalRef.value?.close();
    }
});
</script>

<template>
    <dialog class="modal" ref="modalRef">
        <div class="modal-box">
            <form method="dialog">
                <button class="btn-ghost btn-sm btn-circle btn absolute right-2 top-2">✕</button>
                <h3 class="text-lg font-bold">{{ title }}</h3>
                <p class="py-4" v-if="description">{{ description }}</p>
                <div class="modal-action">
                    <button class="btn-ghost btn">{{ cancelLabel || _t('Cancel') }}</button>
                    <button class="btn-primary btn" value="continue">{{ okLabel || _t('Continue') }}</button>
                </div>
            </form>
        </div>
        <form class="modal-backdrop" method="dialog">
            <button>{{ _t('close') }}</button>
        </form>
    </dialog>
</template>
