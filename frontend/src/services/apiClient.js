import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");
const apiClient = axios.create({ baseURL: API_BASE_URL });

export { API_BASE_URL };
export default apiClient;
