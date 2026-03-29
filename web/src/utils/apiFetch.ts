export interface ApiFetchOptions extends RequestInit {
  cacheKey?: string;
}

export type LoginUser = {
  name: string;
};

const STORAGE_PREFIX = 'lp_';

/**
 * Controlla se l'utente è loggato
 * @returns {Promise<{ success: boolean; user?: LoginUser }>}
 */
export const apiCheck = async (): Promise<{ success: boolean; user?: LoginUser }> => {
  if (!localStorage.getItem(STORAGE_PREFIX + 'refreshToken')) {
    localStorage.removeItem(STORAGE_PREFIX + 'user');
    return { success: false };
  }

  // Prevenzione Offline Manuale (per maggiore rapidità e controllo sul tipo di ritorno)
  if (!navigator.onLine) {
    const cachedUser = localStorage.getItem(STORAGE_PREFIX + 'user');
    if (cachedUser) {
      return { success: true, user: JSON.parse(cachedUser) as LoginUser };
    }
    return { success: false };
  }

  try {
    // Usiamo apiFetch così ereditiamo la logica di Refresh nel caso il cookie sia scaduto
    // ma il refreshToken sia ancora valido. Usiamo cacheKey 'user' per lp_user.
    const resp = await apiFetch('/api/auth/check', { cacheKey: 'user' });
    if (resp.ok) {
      const userS = (await resp.json()) as LoginUser;
      return { success: true, user: userS };
    }
  } catch (error) {
    // Il fallback offline è già gestito da apiFetch che restituirebbe una 200 mockata,
    // ma in caso di eccezione vera (timeout raro) o se apiFetch fallisce:
    const cachedUser = localStorage.getItem(STORAGE_PREFIX + 'user');
    if (cachedUser) {
      return { success: true, user: JSON.parse(cachedUser) as LoginUser };
    }
  }
  return { success: false };
};

/**
 * Esegue il login
 * @param data { name: string; password: string }
 * @returns {Promise<boolean>}
 */
export const apiLogin = async (data: { name: string; password: string }): Promise<boolean> => {
  if (!navigator.onLine) throw new Error('Offline');
  const resp = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (resp.ok) {
    const loginResp = await resp.json();
    localStorage.setItem(STORAGE_PREFIX + 'refreshToken', loginResp.refreshToken);
    return true;
  }
  return false;
};

// Teniamo traccia del refresh in corso
let refreshPromise: Promise<boolean> | null = null;

// Funzione isolata che esegue il refresh del token
export const doRefreshToken = async (): Promise<boolean> => {
  const token = localStorage.getItem(STORAGE_PREFIX + 'refreshToken');
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
        localStorage.setItem(STORAGE_PREFIX + 'refreshToken', loginResp.refreshToken);
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

/**
 * Esegue il logout
 
 */
export const apiLogout = async () => {
  console.log('[apiFetch] Logging out and clearing storage...');

  // Pulisci TUTTO ciò che inizia con il prefisso (compreso token, user e cacheKey varie)
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });

  window.dispatchEvent(new Event('auth:logout'));

  if (navigator.onLine) {
    try {
      // Usiamo fetch nativo per non passare dal wrapper ed evitare loop
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('[apiFetch] Remote logout failed (offline?)', e);
    }
  }
};

/**
 * Wrapper centrale delle API
 * @param input RequestInfo | URL
 * @param init ApiFetchOptions
 * @returns Response
 */
export const apiFetch = async (input: RequestInfo | URL, init?: ApiFetchOptions): Promise<Response> => {
  const cacheKey = init?.cacheKey ? STORAGE_PREFIX + init.cacheKey : null;

  // Shortcut per offline puro: bypassa l'attesa di un errore di fetch
  if (!navigator.onLine) {
    if (cacheKey) {
      const cachedData = localStorage.getItem(cacheKey);
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
      // Non andiamo in loop infinito se fallisce proprio il refresh o il login
      if (!urlStr.includes('/api/auth/refresh') && !urlStr.includes('/api/auth/login')) {
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
    if (response.ok && cacheKey) {
      const clonedResponse = response.clone();
      try {
        const body = await clonedResponse.json();
        localStorage.setItem(cacheKey, JSON.stringify(body));
      } catch (e) {
        // Ignora
      }
    }

    return response;
  } catch (error) {
    // Offline o Network Err: Interveniamo con la cache se disponibile
    if (cacheKey) {
      const cachedData = localStorage.getItem(cacheKey);
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

/**
 * Esegue un "Hard Reset" dell'applicazione:
 * Elimina Service Worker, svuota le Cache browser e ricarica la pagina.
 */
export const hardResetApp = async () => {
  console.warn('[apiFetch] Hard Reset initiated...');

  // 1. Elimina i Service Workers registrati
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }

  // 2. Svuota tutte le Cache del browser (Cache Storage API)
  if ('caches' in window) {
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }
  }

  // 3. Pulisci il LocalStorage (lp_ prefix)
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });

  // 4. Ricarica la pagina ignorando la cache del browser
  window.location.reload();
};
