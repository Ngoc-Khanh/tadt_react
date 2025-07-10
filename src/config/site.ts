export const siteConfig = {
  auth: {
    jwt_key: 'access_token',
  },
  
  backend: {
    base_url: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    base_headers: {
      'Content-Type': 'application/json',
    }
  }
}

export type SiteConfig = typeof siteConfig;