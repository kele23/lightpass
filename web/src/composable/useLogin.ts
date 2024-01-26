import { ref } from 'vue';
import { instance, refreshToken, setToken } from '../services/axios.ts';

type LoginTokenResp = {
    token: string;
    refreshToken: string;
};

const isLogged = ref(false);
const loginPopup = ref(false);
const loading = ref(true);

const initCheck = async () => {
    try {
        const token = await refreshToken();
        setToken(token);
        isLogged.value = true;
    } catch (e) {
        console.warn('User not logged');
    } finally {
        loading.value = false;
    }
};

initCheck();

export function useLogin() {
    return {
        isLogged,
        loginPopup,
        loading,
        login: async ({ username, password }: { username: string; password: string }) => {
            try {
                const resp = await instance.post<LoginTokenResp>('/auth/login', { username, password });
                setToken(resp.data);
                isLogged.value = true;
            } catch (e) {
                throw e;
            }
        },
    };
}
