import axios, { type AxiosInstance } from "axios";

const API: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
})

export function setAuthToken(token: string | null){
    if(token){
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else{
        delete API.defaults.headers.common['Authorization'];
    }
}

export default API;