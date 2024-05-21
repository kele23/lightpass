import { ref } from 'vue';
import { AuthService } from '../api/services.gen.ts';

export type LoginUser = {
    name: string;
};

const loggedIn = ref<boolean>(false);
const user = ref<LoginUser>();

const isLoggedIn = async (): Promise<boolean> => {
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

        loggedIn.value = false;
        user.value = undefined;
        console.warn(e);
    }
    return false;
};

// laungh isLoggedIn first time
isLoggedIn();

export function useLogin() {
    const login = async (data: { name: string; password: string }) => {
        try {
            const respData = await AuthService.postApiAuthLogin({ body: data });

            // set refresh token
            localStorage.setItem('refreshToken', respData.refreshToken);
            return await isLoggedIn();
        } catch (e) {
            console.warn(e);
        }
        return false;
    };

    const refreshToken = async () => {
        let refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            loggedIn.value = false;
            user.value = undefined;
            return false;
        }

        try {
            await AuthService.postApiAuthRefresh({ body: { refreshToken } });
            return true;
        } catch (e) {
            console.warn(e);
            loggedIn.value = false;
            user.value = undefined;
        }

        return false;
    };

    const logout = async () => {
        try {
            await AuthService.postApiAuthLogout();
            localStorage.removeItem('refreshToken');
            return await isLoggedIn();
        } catch (e) {
            console.warn(e);
        }
        return false;
    };

    return { login, logout, refreshToken, loggedIn, user };
}
