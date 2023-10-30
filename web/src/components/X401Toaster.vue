<script setup lang="ts">
import useToasterStore, { TToastStatus } from '../stores/toaster';

const toastClassMap: Record<TToastStatus, string> = {
    error: 'alert-error',
    warning: 'alert-warning',
    success: 'alert-success',
};
const toastStore = useToasterStore();
</script>

<template>
    <div v-if="toastStore.toasts.length" class="toast-end toast">
        <div
            v-for="toast in toastStore.toasts"
            :class="['alert', 'text-lg', toastClassMap[toast.status]]"
            :key="toast.text"
        >
            <span v-html="toast.text"></span>
        </div>
    </div>
</template>
