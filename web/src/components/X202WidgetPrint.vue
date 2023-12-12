<script setup lang="ts">
import X200Widget from './X200Widget.vue';
import { _t } from '../services/dictionary.ts';
import { BackspaceIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
    table: HTMLElement;
}>();

async function print(event: SubmitEvent) {
    const form = new FormData(event.target as HTMLFormElement);
    const title = `<h1 class="text-3xl font-bold mb-4 mt-8">${form.get('title') || 'Risultati'}</h1>`;
    let subtitle = '';
    if (form.get('subtitle')) {
        subtitle += `<p class="mt-2 text-lg mb-4">${form.get('subtitle')}</p>`;
    }

    const printWindow = window.open('', '', 'height=1000,width=800');
    if (printWindow == null) return;

    // write page
    printWindow.document.write(`
        <html>
            <head>
                <title>Print</title>
                <style>
                    @page { margin: 0; }
                    body {
                        padding-left: 16px;
                        padding-right: 16px;
                        font-size: 13px;
                    }
                </style>
            </head>
            <body>
                ${title}
                ${subtitle}
                <table class="w-full table-auto">${props.table.innerHTML}</table>
            </body>
        </html>`);

    // write style
    document.head.querySelectorAll('link, style').forEach((htmlElement) => {
        printWindow.document.head.appendChild(htmlElement.cloneNode(true));
    });

    printWindow.document.close();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 1000);
}
</script>
<template>
    <X200Widget>
        <form @submit.prevent="print($event as SubmitEvent)">
            <div class="flex items-center justify-between">
                <span class="font-bold"> {{ _t('Print') }} </span>
                <button class="btn" title="Clear" type="reset">
                    <BackspaceIcon class="h-6 w-6" />
                </button>
            </div>

            <div class="mt-6">
                <input
                    type="text"
                    class="input-bordered input w-full max-w-xs"
                    required
                    :placeholder="_t('Title')"
                    name="title"
                />
            </div>

            <div class="mt-6">
                <input
                    type="text"
                    class="input-bordered input w-full max-w-xs"
                    :placeholder="_t('Subtitle')"
                    name="subtitle"
                />
            </div>

            <div class="mt-6 w-full">
                <button class="btn-primary btn" type="submit">{{ _t('Print') }}</button>
            </div>
        </form>
    </X200Widget>
</template>
