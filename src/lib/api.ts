import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace("http://", "https://") || "http://localhost:8000",
  withCredentials: true,
});

// Interceptor para añadir token de forma segura
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("⚠️ No hay token en localStorage, no se envía Authorization.");
    }
  }
  return config;
}, (error) => {
  console.error("Error en el interceptor de request:", error);
  return Promise.reject(error);
});

export default api;