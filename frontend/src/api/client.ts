import axios from "axios";

// Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to get/set tokens in localStorage
export function getAccessToken() {
    return localStorage.getItem("access");
}

export function getRefreshToken() {
    return localStorage.getItem("refresh");
}

export function setTokens(access: string, refresh: string) {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
}

export function clearTokens() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
}

// Centralized Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
});

// Axios interceptor for refreshing tokens
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

// Request interceptor: attach access token to every request
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token && config && config.headers) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor: handle 401 errors and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            getRefreshToken()
        ) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers["Authorization"] =
                            "Bearer " + token;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(
                    `${API_BASE_URL}/auth/refresh/`,
                    { refresh: getRefreshToken() },
                );
                setTokens(data.access, data.refresh);
                api.defaults.headers.common["Authorization"] =
                    "Bearer " + data.access;
                processQueue(null, data.access);
                originalRequest.headers["Authorization"] =
                    "Bearer " + data.access;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                // Optionally: window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    },
);

export default api;
