import axios from "axios";

export const TOKEN_STORAGE_KEY = "queueease_admin_token";
export const AUTH_EXPIRED_EVENT = "queueease:auth-expired";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.url !== "/auth/login" &&
      localStorage.getItem(TOKEN_STORAGE_KEY)
    ) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export const loginAdmin = (credentials) => api.post("/auth/login", credentials).then((r) => r.data);
export const getQueue = () => api.get("/queue").then((r) => r.data);
export const getStats = () => api.get("/queue/stats").then((r) => r.data);
export const createQueue = (payload) => api.post("/queue", payload).then((r) => r.data);
export const callNext = () => api.patch("/queue/call-next").then((r) => r.data);
export const completeQueue = (id) => api.patch(`/queue/${id}/done`).then((r) => r.data);
