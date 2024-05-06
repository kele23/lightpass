import { ref } from 'vue';

export type LoginUser = {
    ok: boolean;
    userCtx: {
        name: string;
    };
};

export const loggedIn = ref<boolean>(false);
export const user = ref<LoginUser>();
export const isLoggingIn = ref<boolean>(false);

const isLoggedIn = async (): Promise<boolean> => {
    if (loggedIn.value) return true;
    try {
        const resp = await fetch('/api/db/_session');
        const tmpUser = (await resp.json()) as LoginUser;
        if (tmpUser.ok && tmpUser.userCtx.name) {
            user.value = tmpUser;
            loggedIn.value = true;
            return true;
        }
    } catch (e) {
        console.warn(e);
    }
    return false;
};

const login = async (data: { name: string; password: string }) => {
    try {
        isLoggingIn.value = true;
        const resp = await fetch('/api/db/_session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const respData = (await resp.json()) as { ok: boolean };
        if (respData.ok) {
            return await isLoggedIn();
        }
        return false;
    } catch (e) {
        console.warn(e);
    } finally {
        isLoggingIn.value = false;
    }
    return false;
};

export function useLogin() {
    return { isLoggedIn, login, isLoggingIn, loggedIn, user };
}
