import axios from "axios";

/**
 * Base URL for the Spring Boot API.
 *
 * Defaults to "/api", which the Vite dev/preview server proxies to
 * http://localhost:8080 (see vite.config.js). Set VITE_API_URL when
 * the API runs somewhere else, for example:
 *
 *   VITE_API_URL=http://localhost:8080
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

/**
 * Turns an axios error into a message the UI can display.
 *
 * The backend now returns { "message": "..." } for checkout
 * failures, so those are surfaced directly.
 */
function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) {
    return fallback;
  }

  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const message = data.message || data.error || data.detail;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error.code === "ECONNABORTED") {
    return "The server took too long to respond. Please try again.";
  }

  if (error instanceof TypeError || error.message === "Network Error") {
    return "Cannot connect to the Community Store server.";
  }

  return error.message || fallback;
}

export { API_BASE_URL, getErrorMessage };
export default apiClient;
