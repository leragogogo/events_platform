import axios from "axios";

// Plain axios instance for Jest (no import.meta.env — that is Vite-specific)
export default axios.create({ baseURL: "http://localhost:5000/api", withCredentials: true });
