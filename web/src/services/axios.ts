// Implementing a request queue in Axios interceptors
import axios, { AxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.SYNC_URL || 'https://localk:8080';

let token = '';
export const instance = axios.create({ baseURL });

export type TokenRefresh = {
    token: string;
    refreshToken: string;
};

export const setToken = (data: { token: string; refreshToken: string }) => {
    token = data.token;
    localStorage.setItem('refreshToken', data.refreshToken);
};

export const refreshToken = async () => {
    if (!localStorage.getItem('refreshToken')) throw 'Missing refresh token';

    const refresh = await axios<TokenRefresh>({
        method: 'POST',
        url: `${baseURL}/auth/refresh`,
        data: {
            refreshToken: localStorage.getItem('refreshToken'),
        },
    });
    return refresh.data;
};

////////////////////////////////////////////////// REQ
// add token to all request if present
instance.interceptors.request.use(
    function (config) {
        if (token) {
            config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
    },
    (error) => {
        Promise.reject(error);
    }
);

////////////////////////////////////////////////// RESP
// Define the structure of a retry queue item
interface RetryQueueItem {
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
    config: AxiosRequestConfig;
}

// Create a list to hold the request queue
const refreshAndRetryQueue: RetryQueueItem[] = [];

// intercept error 401 token
let isRefreshing = false;
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest: AxiosRequestConfig = error.config;

        if (error.response && error.response.status === 401) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    // Refresh the access token
                    const newToken = await refreshToken();
                    setToken(newToken);

                    // Update the request headers with the new access token
                    error.config.headers['Authorization'] = `Bearer ${token}`;

                    // Retry all requests in the queue with the new token
                    refreshAndRetryQueue.forEach(({ config, resolve, reject }) => {
                        instance
                            .request(config)
                            .then((response) => resolve(response))
                            .catch((err) => reject(err));
                    });

                    // Clear the queue
                    refreshAndRetryQueue.length = 0;

                    // Retry the original request
                    return instance(originalRequest);
                } catch (refreshError) {
                    // Handle token refresh error
                    // You can clear all storage and redirect the user to the login page
                    throw refreshError;
                } finally {
                    isRefreshing = false;
                }
            }

            // Add the original request to the queue
            return new Promise<void>((resolve, reject) => {
                refreshAndRetryQueue.push({ config: originalRequest, resolve, reject });
            });
        }

        // Return a Promise rejection if the status code is not 401
        return Promise.reject(error);
    }
);
