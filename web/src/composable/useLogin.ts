import { ref } from 'vue';

export type LoginUser = {
  name: string;
};

const loggedIn = ref<boolean>(false);
const user = ref<LoginUser>();

const isLoggedIn = async (): Promise<boolean> => {
  try {
    const resp = await fetch('/api/auth/check');
    if (resp.ok) {
      const userS = await resp.json();
      user.value = userS;
      loggedIn.value = true;
      localStorage.setItem('lightpassUser', JSON.stringify(userS));
      return true;
    } else {
      loggedIn.value = false;
      user.value = undefined;
      localStorage.removeItem('lightpassUser');
    }
  } catch (error) {
    // Se c'è un errore di rete (offline), proviamo a ripristinare la sessione salvata in precedenza
    const cachedUser = localStorage.getItem('lightpassUser');
    if (cachedUser) {
      user.value = JSON.parse(cachedUser);
      loggedIn.value = true;
      return true;
    }

    loggedIn.value = false;
    user.value = undefined;
  }

  return false;
};

// laungh isLoggedIn first time
isLoggedIn();

let refreshPromise: Promise<boolean> | null = null;

export function useLogin() {
  const isLoggingIn = ref<boolean>(false);

  const login = async (data: { name: string; password: string }) => {
    isLoggingIn.value = true;
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (resp.ok) {
        const loginResp = await resp.json();
        localStorage.setItem('refreshToken', loginResp.refreshToken);
        return await isLoggedIn();
      }
      return false;
    } finally {
      isLoggingIn.value = false;
    }
  };

  const refreshToken = async () => {
    if (refreshPromise) {
      return refreshPromise;
    }
    refreshPromise = (async () => {
      try {
        const resp = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
        });

        if (resp.ok) {
          const loginResp = await resp.json();
          localStorage.setItem('refreshToken', loginResp.refreshToken);
          return await isLoggedIn();
        }

        return false;
      } catch (error) {
        console.error('Errore durante il refresh:', error);
        return false;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  const logout = async () => {
    const resp = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (resp.ok) {
      isLoggedIn();
      return true;
    }
    return false;
  };

  return { login, logout, refreshToken, loggedIn, user, isLoggingIn };
}
