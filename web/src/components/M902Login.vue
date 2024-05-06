<script setup lang="ts">
import { useLogin } from '../composable/useLogin.ts';
import { _t } from '../services/dictionary.ts';
import router from '../services/router.ts';
import useToasterStore from '../stores/toaster.ts';

const toasterStore = useToasterStore();
const { login, isLoggingIn } = useLogin();

const doLogin = (e: SubmitEvent) => {
    const form = new FormData(e.target as HTMLFormElement);

    const data = {
        name: form.get('name') as string,
        password: form.get('password') as string,
    };

    const ok = login(data);
    if (!ok) {
        toasterStore.warning({ text: _t('Cannot login') });
    } else {
        router.push('/');
    }
};
</script>

<template>
    <div class="container mx-auto">
        <div class="flex w-full flex-wrap">
            <div class="flex w-full flex-col items-center justify-center md:w-1/2">
                <div class="my-4 flex w-full max-w-sm flex-col justify-center px-8 pt-8 md:pt-0">
                    <p class="text-center text-3xl">{{ _t('Lightpass V4') }}</p>
                    <form class="flex flex-col gap-4 pt-6" @submit.prevent="doLogin">
                        <input
                            type="text"
                            class="input input-bordered w-full max-w-sm"
                            name="name"
                            autocomplete="username"
                            placeholder="mario"
                        />
                        <input
                            type="password"
                            class="input input-bordered w-full max-w-sm"
                            name="password"
                            autocomplete="password"
                            placeholder="xxxxxxx"
                        />

                        <button class="btn" type="submit" :disabled="isLoggingIn">
                            <span class="w-full"> {{ _t('Login') }} </span>
                        </button>
                    </form>
                    <p class="mt-8 text-center">{{ _t("You can't remember username or password?") }}</p>
                    <p class="text-center">{{ _t("Sorry you can't access") }}</p>
                </div>
            </div>
            <div class="w-1/2 shadow-2xl">
                <img class="hidden h-screen w-full object-cover md:block" src="../assets/race.webp" />
            </div>
        </div>
    </div>
</template>
