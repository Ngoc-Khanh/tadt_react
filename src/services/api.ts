import { siteConfig } from "@/config";
import { getAccessToken } from "@/lib/get-token";
import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { AuthAPI } from "./auth.api";

const api = axios.create({
  baseURL: siteConfig.backend.base_url,
  headers: siteConfig.backend.base_headers
})

// Add a request interceptor to include the JWT token in the headers
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers.Authorization = `Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoibWFwc2FwaSIsIm9yZ2lkIjoiIiwiaWF0Ijo2Mzg4NzczMDM5MjUxODQzOTEsInVzZXJpZCI6ImIyNDM4ZTAxLTZmYjItNDc5Ni05NDFjLWQwNWMyZWNiNDhkNSIsInVzZXJuYW1lIjoibWFwc2FwaSIsImZ1bGxuYW1lIjoiTWFwcyBBUEkiLCJvcmdjb2RlIjoiIiwib3JnbmFtZSI6IiIsImV4cCI6MTc1MjE2Njc5OX0.7zgegNyI7uAcRYq54BcyISRWUKTEeSZgUrGB5oGK9EIAXJXW03f-L2MEs8KPjqbW6sBZNw6ie6tT3hQOuIqQpg`;
    return config;
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('[API] Token expired, attempting auto re-login');
      try {
        const res = await AuthAPI.login({
          UserName: 'mapsapi',
          Password: '123456'
        })
        if (res.Token) {
          localStorage.setItem(siteConfig.auth.jwt_key, res.Token);
          error.config.headers.Authorization = `Bearer ${res.Token}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        console.error('[API] Auto re-login failed:', refreshError);
        localStorage.removeItem(siteConfig.auth.jwt_key);
      }
    }
    return Promise.reject(error);
  }
)

export const apiGet = async <ResponseData = unknown>(
  endpoint: string,
  config?: AxiosRequestConfig
) => api.get<ResponseData>(endpoint, config)

export const apiPost = async <PostData = unknown, ResponseData = unknown>(
  endpoint: string,
  data: PostData,
  config?: AxiosRequestConfig
) => api.post<ResponseData, AxiosResponse<ResponseData>>(endpoint, data, config);

export default api;