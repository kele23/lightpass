<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useRace } from '../composable/useRace.ts';
import { _t } from '../services/dictionary.ts';
import { useLogin } from '../composable/useLogin.ts';
import { UserCircleIcon } from '@heroicons/vue/24/outline';

/////////////////////////////////////////////////////
const { races, addRace, setCurrentRace } = useRace();
const { loggedIn, user } = useLogin();
const router = useRouter();

/////////////////////////////////////////////////////
async function createRace(event: Event) {
    const formData = new FormData(event.target as HTMLFormElement);
    const raceName = formData.get('name') as string;
    const doc = await addRace({ name: raceName });
    if (doc) {
        await setCurrentRace(doc);
        router.push('/race');
    }
}

async function selectRace(event: Event) {
    const formData = new FormData(event.target as HTMLFormElement);
    const id = formData.get('name');
    if (races.value) {
        const race = races.value.find((item) => item._id == id);
        if (race) {
            await setCurrentRace(race);
            router.push('/race');
        }
    }
}
</script>

<template>
    <div class="container mx-auto">
        <div class="flex w-full flex-wrap">
            <div class="flex w-full flex-col items-center justify-center md:w-1/2">
                <div class="mb-4 flex items-center gap-6" v-if="!loggedIn">
                    <router-link to="/login" class="btn btn-ghost">
                        <UserCircleIcon class="h-5 w-5" /> {{ _t('Login') }}
                    </router-link>
                </div>
                <div class="mb-4 flex items-center gap-2" v-if="loggedIn">
                    <UserCircleIcon class="h-5 w-5" />
                    <span
                        >{{ _t('Hi') }} <b class="text-lg">{{ user?.name }}</b></span
                    >
                </div>
                <div class="flex items-center justify-center">
                    <hr class="w-32" />
                </div>
                <div class="my-4 flex w-full max-w-xs flex-col justify-center px-8 pt-8 md:pt-0">
                    <p class="text-center text-3xl">{{ _t('Select a race') }}</p>
                    <form class="flex flex-col pt-3" @submit.prevent="selectRace">
                        <div class="flex flex-col pb-4 pt-4">
                            <div class="relative flex">
                                <select class="select select-bordered w-full max-w-xs" name="name">
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
                <div class="my-4 flex w-full max-w-xs flex-col justify-center px-8 pt-8 md:pt-0" 
                    :class="!loggedIn ? 'opacity-30 pointer-events-none': ''">
                    <p class="text-center text-3xl">{{ _t('New race') }}</p>
                    <form class="flex flex-col pt-3" @submit.prevent="createRace">
                        <div class="flex flex-col pb-4 pt-4">
                            <div class="relative flex">
                                <input
                                    type="text"
                                    class="input input-bordered w-full max-w-xs"
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
