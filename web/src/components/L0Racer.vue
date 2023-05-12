<script setup>
import { getDBManager } from '../services/db-manager';
import { useRouter } from 'vue-router';

/////////////////////////////////////////////////////
const dbManager = getDBManager();
const races = await dbManager.getAllRace();
const router = useRouter();

/////////////////////////////////////////////////////
async function createRace(event) {
    console.log('create');
    const formData = new FormData(event.target);
    const raceName = formData.get('name');
    const doc = await dbManager.createRace(raceName);
    router.push('/' + doc.id);
}

async function selectRace(event) {
    const formData = new FormData(event.target);
    const id = formData.get('name');
    router.push('/' + id);
}
</script>

<template>
    <div class="flex w-full flex-wrap">
        <div class="flex w-full flex-col justify-center md:w-1/2">
            <div class="my-4 flex flex-col justify-center px-8 pt-8 md:px-24 md:pt-0 lg:px-32">
                <p class="text-center text-3xl">Selezione una Gara</p>
                <form class="flex flex-col pt-3" @submit.prevent="selectRace">
                    <div class="flex flex-col pt-4 pb-4">
                        <div class="relative flex">
                            <select
                                class="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none"
                                name="name"
                            >
                                <option value="">Seleziona una gara</option>

                                <option v-for="item in races" :key="item._id" :value="item._id">
                                    {{ item.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        class="w-full rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                    >
                        <span class="w-full"> Seleziona </span>
                    </button>
                </form>
            </div>
            <div class="flex items-center justify-center">
                <hr class="w-16" />
                <div class="px-5">O</div>
                <hr class="w-16" />
            </div>
            <div class="my-4 flex flex-col justify-center px-8 pt-8 md:px-24 md:pt-0 lg:px-32">
                <p class="text-center text-3xl">Crea una Gara</p>
                <form class="flex flex-col pt-3 md:pt-8" @submit.prevent="createRace">
                    <div class="flex flex-col pt-4 pb-4">
                        <div class="relative flex">
                            <input
                                type="text"
                                class="w-full flex-1 appearance-none border border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600"
                                name="name"
                                placeholder="es: E Ben Sa Ghe 2023"
                            />
                        </div>
                    </div>
                    <button
                        class="flex-shrink-0 rounded-lg bg-gray-500 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-200"
                        type="submit"
                    >
                        <span class="w-full"> Crea </span>
                    </button>
                </form>
            </div>
        </div>
        <div class="w-1/2 shadow-2xl">
            <img class="hidden h-screen w-full object-cover md:block" src="../assets/race.webp" />
        </div>
    </div>
</template>

<style></style>
