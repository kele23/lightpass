<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useRace } from '../composable/useRace.ts';
import { _t } from '../services/dictionary.ts';

/////////////////////////////////////////////////////
const { races, addRace, setCurrentRace } = useRace();
const router = useRouter();

/////////////////////////////////////////////////////
async function createRace(event: Event) {
    const formData = new FormData(event.target as HTMLFormElement);
    const raceName = formData.get('name') as string;
    const doc = await addRace(raceName);
    await setCurrentRace(doc._id);
    router.push('/');
}

async function selectRace(event: Event) {
    const formData = new FormData(event.target as HTMLFormElement);
    const id = formData.get('name');
    setCurrentRace(id as string);
    router.push('/');
}
</script>

<template>
    <div class="container mx-auto">
        <div class="flex w-full flex-wrap">
            <div class="flex w-full flex-col items-center justify-center md:w-1/2">
                <div class="my-4 flex w-full max-w-xs flex-col justify-center px-8 pt-8 md:pt-0">
                    <p class="text-center text-3xl">{{ _t('Select a race') }}</p>
                    <form class="flex flex-col pt-3" @submit.prevent="selectRace">
                        <div class="flex flex-col pt-4 pb-4">
                            <div class="relative flex">
                                <select class="select-bordered select w-full max-w-xs" name="name">
                                    <option value="">{{ _t('Select a race') }}</option>

                                    <option v-for="item in races" :key="item._id" :value="item._id">
                                        {{ item.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn">
                            <span class="w-full"> {{ _t('Continue') }} </span>
                        </button>
                    </form>
                </div>
                <div class="flex items-center justify-center">
                    <hr class="w-16" />
                    <div class="px-5">{{ _t('or') }}</div>
                    <hr class="w-16" />
                </div>
                <div class="my-4 flex w-full max-w-xs flex-col justify-center px-8 pt-8 md:pt-0">
                    <p class="text-center text-3xl">{{ _t('New race') }}</p>
                    <form class="flex flex-col pt-3" @submit.prevent="createRace">
                        <div class="flex flex-col pt-4 pb-4">
                            <div class="relative flex">
                                <input
                                    type="text"
                                    class="input-bordered input w-full max-w-xs"
                                    name="name"
                                    placeholder="es: E Ben Sa Ghe 2023"
                                />
                            </div>
                        </div>
                        <button class="btn" type="submit">
                            <span class="w-full"> {{ _t('Create') }} </span>
                        </button>
                    </form>
                </div>
            </div>
            <div class="w-1/2 shadow-2xl">
                <img class="hidden h-screen w-full object-cover md:block" src="../assets/race.webp" />
            </div>
        </div>
    </div>
</template>
