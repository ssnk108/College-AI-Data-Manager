import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL;
if (!rawApiUrl) {
  throw new Error(
    "VITE_API_URL is not defined. Create frontend/.env with VITE_API_URL=http://localhost:5000"
  );
}
const apiBaseUrl = rawApiUrl.replace(/\/+$/, "");

export const api = axios.create({
  baseURL: `${apiBaseUrl}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config?.url === "/health" && response.data?.databaseConnected) {
      window.dispatchEvent(new CustomEvent("database-status", { detail: { connected: true, message: "" } }));
    }
    return response;
  },
  (error) => {
    const data = error.response?.data;
    if (data?.databaseConnected === false || error.response?.status === 503) {
      window.dispatchEvent(new CustomEvent("database-status", {
        detail: {
          connected: false,
          message: data?.message || "Database temporarily unavailable",
          database: data?.database || "unknown",
          nextRetryAt: data?.nextRetryAt || null
        }
      }));
    }
    return Promise.reject(error);
  }
);

export const healthApi = {
  get: () => api.get("/health").then((res) => res.data)
};

export const collegeApi = {
  list: (params) => api.get("/colleges", { params }).then((res) => res.data),
  get: (id) => api.get(`/colleges/${id}/public`).then((res) => res.data),
  getAdmin: (id) => api.get(`/colleges/${id}/admin`).then((res) => res.data),
  create: (data) => api.post("/colleges", data).then((res) => res.data),
  createSeparate: (data) => api.post("/colleges", { ...data, forceCreate: true }).then((res) => res.data),
  merge: (id, data) => api.post(`/colleges/merge/${id}`, data).then((res) => res.data),
  update: (id, data) => api.put(`/colleges/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/colleges/${id}`).then((res) => res.data),
  aiExtract: (data) => api.post("/ai/extract-college", data).then((res) => res.data)
};

export const authApi = {
  login: (data) => api.post("/auth/login", data).then((res) => res.data),
  me: () => api.get("/auth/me").then((res) => res.data)
};

export const privateApi = {
  getCollege: (id) => api.get(`/private/college/${id}`).then((res) => res.data),
  updateCollege: (id, tokenOrData, maybeData) => {
    const data = maybeData || tokenOrData;
    return api.put(`/private/college/${id}`, data).then((res) => res.data);
  }
};

export const adminReportsApi = {
  list: () => api.get("/admin/reports").then((res) => res.data),
  generate: (data) => api.post("/admin/reports/generate", data).then((res) => res.data),
  remove: (id) => api.delete(`/admin/reports/${id}`).then((res) => res.data)
};

export const consultancyApi = {
  list: () => api.get("/admin/consultancy").then((res) => res.data),
  create: (data) => api.post("/admin/consultancy", data).then((res) => res.data),
  update: (id, data) => api.put(`/admin/consultancy/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/admin/consultancy/${id}`).then((res) => res.data)
};

export const mergeQueueApi = {
  list: () => api.get("/admin/merge-queue").then((res) => res.data),
  detect: () => api.post("/admin/merge-queue/detect").then((res) => res.data),
  merge: (id, decision) => api.post(`/admin/merge-queue/${id}/merge`, { decision }).then((res) => res.data),
  ignore: (id) => api.post(`/admin/merge-queue/${id}/ignore`).then((res) => res.data)
};

export const debugApi = {
  listLogs: (params) => api.get("/admin/extraction-logs", { params }).then((res) => res.data),
  retry: (id) => api.post(`/admin/extraction-logs/${id}/retry`).then((res) => res.data),
  clear: () => api.post("/admin/settings/danger-action", { action: "clear-logs" }).then((res) => res.data)
};

export const settingsApi = {
  get: () => api.get("/admin/settings").then((res) => res.data),
  update: (data) => api.put("/admin/settings", data).then((res) => res.data),
  exportData: (format) => api.post("/admin/settings/export", { format }, { responseType: 'blob' })
};
