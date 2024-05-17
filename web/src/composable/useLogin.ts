import { ref } from 'vue';
import { AuthService } from '../api/services.gen.ts';

export type LoginUser = {
    name: string;
};

export const loggedIn = ref<boolean>(false);
export const user = ref<LoginUser>();
export const isLoggingIn = ref<boolean>(false);

const isLoggedIn = async (): Promise<boolean> => {
    // if logged in, ok continue
    if (loggedIn.value) return true;

    // if no refresh found, return false
    if (!localStorage.getItem('refreshToken')) return false;

    // check token valid
    try {
        let resp = await AuthService.getApiAuthCheck();
        user.value = resp;
        loggedIn.value = true;
        return true;
    } catch (e) {
        // if (resp.status == 401) {
        //     // retry after refresh is 401
        //     const refresh = await refreshToken();
        //     if (refresh) {
        //         resp = await AuthService.getApiAuthCheck();
        //     }
        // }

        console.warn(e);
    }
    return false;
};

const login = async (data: { name: string; password: string }) => {
    try {
        isLoggingIn.value = true;
        const respData = await AuthService.postApiAuthLogin({ body: data });

        // set refresh token
        localStorage.setItem('refreshToken', respData.refreshToken);
        return await isLoggedIn();
    } catch (e) {
        console.warn(e);
    } finally {
        isLoggingIn.value = false;
    }
    return false;
};

let timeout: any = null;
export const refreshToken = async () => {
    let refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        loggedIn.value = false;
        user.value = undefined;
        return false;
    }

    try {
        await AuthService.postApiAuthRefresh({ body: { refreshToken } });
        timeout = setTimeout(refreshToken, 9 * 60 * 1000);
        return true;
    } catch (e) {
        console.warn(e);
        loggedIn.value = false;
        user.value = undefined;
    }

    return false;
};

///////////////////
isLoggedIn(); // launch isLoggedIn first time
export function useLogin() {
    return { isLoggedIn, login, isLoggingIn, loggedIn, user };
}
