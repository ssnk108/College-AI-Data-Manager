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

export const collegeApi = {
  list: (params) => api.get("/colleges", { params }).then((res) => res.data),
  get: (id) => api.get(`/colleges/${id}`).then((res) => res.data),
  create: (data) => api.post("/colleges", data).then((res) => res.data),
  update: (id, data) => api.put(`/colleges/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/colleges/${id}`).then((res) => res.data),
  aiExtract: (data) => api.post("/ai/extract-college", data).then((res) => res.data)
};

export const authApi = {
  login: (data) => api.post("/auth/login", data).then((res) => res.data)
};

export const privateApi = {
  getCollege: (id, token) => api.get(`/private/college/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data),
  updateCollege: (id, token, data) =>
    api.put(`/private/college/${id}`, data, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data)
};
