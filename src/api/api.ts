import { useTokenStore } from "@/stores/tokenStore";
import axios from "axios";

// Create axios instance with default configuration
const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
    timeout: 1000 * 60 * 3, // 30 seconds timeout
    headers: {
        Accept: "application/json",
    },
});

// Request interceptor for adding auth tokens, logging, etc.
api.interceptors.request.use(
    (config) => {
        const sessionToken = useTokenStore.getState().sessionToken;

        if (sessionToken) {
            config.headers["X-Session-Token"] = sessionToken;
        }

        // Log request in development
        if (process.env.NODE_ENV === "development") {
            console.log("🚀 API Request:", {
                method: config.method?.toUpperCase(),
                url: config.url,
                data: config.data,
            });
        }

        return config;
    },
    (error) => {
        console.error("❌ Request Error:", error);
        return Promise.reject(error);
    }
);

export default api;
