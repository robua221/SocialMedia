import axios from "axios";

export const API_BASE = "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_BASE,
});

// Add token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
