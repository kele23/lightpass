import { ref } from 'vue';
import { apiLogout, apiCheck, apiLogin, LoginUser } from '../utils/apiFetch.ts';

const loggedIn = ref<boolean>(false);
const user = ref<LoginUser>();

// Event listener per logout forzato da apiFetch (es: token definitivamente scaduto)
window.addEventListener('auth:logout', () => {
  loggedIn.value = false;
  user.value = undefined;
});

const isLoggedIn = async (): Promise<boolean> => {
  const result = await apiCheck();
  if (result.success) {
    loggedIn.value = true;
    user.value = result.user;
    return true;
  }

  loggedIn.value = false;
  user.value = undefined;
  return false;
};

// laungh isLoggedIn first time
isLoggedIn();

export function useLogin() {
  const isLoggingIn = ref<boolean>(false);

  const login = async (data: { name: string; password: string }) => {
    isLoggingIn.value = true;
    try {
      const success = await apiLogin(data);
      if (success) {
        return await isLoggedIn();
      }
      return false;
    } finally {
      isLoggingIn.value = false;
    }
  };

  const logout = async () => {
    await apiLogout();
    return true;
  };

  return { login, logout, loggedIn, user, isLoggingIn, isLoggedIn };
}
