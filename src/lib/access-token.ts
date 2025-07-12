import { siteConfig } from "@/config";

export const getToken = () => localStorage.getItem(siteConfig.auth.jwt_key) || "";
export const setToken = (token: string) => localStorage.setItem(siteConfig.auth.jwt_key, token);
export const removeToken = () => localStorage.removeItem(siteConfig.auth.jwt_key);