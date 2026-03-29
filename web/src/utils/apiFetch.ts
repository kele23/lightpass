export interface ApiFetchOptions extends RequestInit {
  cacheKey?: string;
}

export type LoginUser = {
  name: string;
};

export const apiCheck = async (): Promise<{ success: boolean; user?: LoginUser }> => {
  if (!localStorage.getItem('refreshToken')) {
    localStorage.removeItem('lightpassUser');
    return { success: false };
  }

  // Prevenzione Offline
  if (!navigator.onLine) {
    const cachedUser = localStorage.getItem('lightpassUser');
    if (cachedUser) {
      return { success: true, user: JSON.parse(cachedUser) as LoginUser };
    }
    return { success: false };
  }

  try {
    const resp = await fetch('/api/auth/check');
    if (resp.ok) {
      const userS = (await resp.json()) as LoginUser;
      localStorage.setItem('lightpassUser', JSON.stringify(userS));
      return { success: true, user: userS };
    } else {
      localStorage.removeItem('lightpassUser');
      return { success: false };
    }
  } catch (error) {
    const cachedUser = localStorage.getItem('lightpassUser');
    if (cachedUser) {
      return { success: true, user: JSON.parse(cachedUser) as LoginUser };
    }
    return { success: false };
  }
};

export const apiLogin = async (data: { name: string; password: string }): Promise<boolean> => {
  if (!navigator.onLine) throw new Error('Offline');
  const resp = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (resp.ok) {
    const loginResp = await resp.json();
    localStorage.setItem('refreshToken', loginResp.refreshToken);
    return true;
  }
  return false;
};

// Teniamo traccia del refresh in corso
let refreshPromise: Promise<boolean> | null = null;

// Funzione isolata che esegue il refresh del token
export const doRefreshToken = async (): Promise<boolean> => {
  const token = localStorage.getItem('refreshToken');
  if (!token) return false;

  if (!navigator.onLine) throw new Error('Offline');

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const resp = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (resp.ok) {
        const loginResp = await resp.json();
        localStorage.setItem('refreshToken', loginResp.refreshToken);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Errore refresh token', e);
      if (!navigator.onLine) throw e; // Rilancia per salvare la sessione in caso di timeout/caduta rete
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Funzione isolata che annulla la sessione
export const apiLogout = async () => {
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('lightpassUser');
  window.dispatchEvent(new Event('auth:logout'));
  if (navigator.onLine) {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
  }
};

// Il Wrapper centrale delle API
export const apiFetch = async (input: RequestInfo | URL, init?: ApiFetchOptions): Promise<Response> => {
  // Shortcut per offline puro: bypassa l'attesa di un errore di fetch
  if (!navigator.onLine) {
    if (init?.cacheKey) {
      const cachedData = localStorage.getItem(init.cacheKey);
      if (cachedData) {
        return new Response(cachedData, {
          status: 200,
          statusText: 'OK [Offline]',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    throw new Error('Offline');
  }

  try {
    let response = await fetch(input, init);

    // Gestione Refresh Token su risposte 401
    if (response.status === 401) {
      const urlStr = input.toString();
      // Non andiamo in loop infinito se una rotta di autenticazione restituisce 401
      if (!urlStr.includes('/api/auth/')) {
        const refreshed = await doRefreshToken();
        if (refreshed) {
          // Token rinfrescato, ripetiamo fiduciosi la chiamata originale!
          response = await fetch(input, init);
        } else {
          // Fallimento refresh: forziamo il logout e restituiamo la cattiva notizia
          await apiLogout();
          return response;
        }
      }
    }

    // Se success e cacheKey richiesta, iniettiamo i dati puliti nel localStorage
    if (response.ok && init?.cacheKey) {
      const clonedResponse = response.clone();
      try {
        const body = await clonedResponse.json();
        localStorage.setItem(init.cacheKey, JSON.stringify(body));
      } catch (e) {
        // Ignora
      }
    }

    return response;
  } catch (error) {
    // Offline o Network Err: Interveniamo con la cache se disponibile
    if (init?.cacheKey) {
      const cachedData = localStorage.getItem(init.cacheKey);
      if (cachedData) {
        return new Response(cachedData, {
          status: 200,
          statusText: 'OK [Offline]',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    throw error;
  }
};
