<script setup></script>

<template>
    <div class="fixed top-0 left-0 right-0 bottom-0 z-50 hidden" data-modal="true">
        <div class="absolute h-full w-full bg-black opacity-30 dark:bg-white"></div>
        <div class="pointer-events-none absolute flex h-full w-full items-center justify-center">
            <div class="pointer-events-auto flex h-40 w-80 flex-col rounded-xl bg-white px-4 py-4 dark:bg-black">
                <h3 class="grow text-xl font-semibold dark:text-white">Vuoi confermare l'operazione?</h3>
                <div class="flex justify-end">
                    <button
                        class="mr-4 min-w-[100px] rounded-lg bg-gray-200 px-4 py-2 text-base font-semibold text-black shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 focus:ring-offset-gray-100"
                    >
                        Annulla
                    </button>
                    <button
                        class="min-w-[100px] rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                    >
                        SI
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
