<script setup lang="ts">
import { ref } from 'vue';
import { _t } from '../services/dictionary.ts';
const modalRef = ref<HTMLDialogElement>();

// const mounted = useMounted();

// // if logged goes to false, then open modal
// watch([loginPopup, mounted], () => {
//     if (!mounted.value) return;
//     if (!loginPopup.value) return;

//     modalRef.value?.showModal();
// });

// const loginMethod = async (form: HTMLFormElement) => {
//     const data = new FormData(form);
//     await login({ username: data.get('username') as string, password: data.get('password') as string });
// };
</script>

<template>
    <dialog class="modal" ref="modalRef">
        <div class="modal-box">
            <form method="dialog">
                <button
                    class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
                    type="button"
                    v-on:click="modalRef?.close()"
                >
                    ✕
                </button>
                <h3 class="text-lg font-bold">{{ _t('Enable AutoSync?') }}</h3>
                <p class="py-4">{{ _t('Complete the authentication form below to enable AutoSync') }}</p>

                <div class="mt-6">
                    <input
                        type="text"
                        class="input input-bordered w-full"
                        required
                        autocomplete="username"
                        placeholder="Username"
                        name="username"
                    />
                </div>
                <div class="mt-6">
                    <input
                        type="password"
                        class="input input-bordered w-full"
                        placeholder="Password"
                        autocomplete="current-password"
                        required
                        name="password"
                    />
                </div>

                <div class="modal-action">
                    <button class="btn btn-ghost" type="button" v-on:click="modalRef?.close()">
                        {{ _t('Cancel') }}
                    </button>
                    <button class="btn btn-primary" value="continue">{{ _t('Continue') }}</button>
                </div>
            </form>
        </div>
        <form class="modal-backdrop" method="dialog">
            <button>{{ _t('close') }}</button>
        </form>
    </dialog>
</template>
