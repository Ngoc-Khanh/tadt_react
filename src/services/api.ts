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
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, { 
      baseURL: config.baseURL,
      headers: config.headers 
    });
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
)

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.config.url);
    return response;
  },
  async (error) => {
    console.error('[API] Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });

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