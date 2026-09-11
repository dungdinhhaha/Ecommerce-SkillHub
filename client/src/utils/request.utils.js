import axios from "axios";


const request = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:7000/api",
    withCredentials: true,
});

request.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default request;
