import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

// `<ClerkProvider>` loads the Clerk browser SDK and exposes it as
// `window.Clerk` once ready — this lets us grab a fresh session token for
// every request without threading React hooks through this plain module.
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined" && window.Clerk?.session) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      // No active session — request proceeds unauthenticated, backend will 401.
    }
  }
  return config;
});

// Normalize error messages so every component can just read err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;
