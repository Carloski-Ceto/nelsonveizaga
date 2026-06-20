import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './auth';

/**
 * Origen del backend en el navegador: `NEXT_PUBLIC_API_URL` en `.env` (p. ej. …/api).
 * Si está vacío, las peticiones van al mismo origen (`/api/...` → Route Handler de Next).
 */
export function browserApiOrigin(): string {
  if (typeof window === 'undefined') return '';
  let u = process.env.NEXT_PUBLIC_API_URL || '';
  if (!u) return '';
  u = u.replace(/\/$/, '');
  if (u.endsWith('/api')) u = u.slice(0, -4);
  return u;
}

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string | null> | null = null;

function resolveApiBaseURL(): string {
  const origin = browserApiOrigin();
  return origin || '';
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        '/api/auth/token/refresh/',
        { refresh },
        {
          baseURL: resolveApiBaseURL(),
          headers: { 'Content-Type': 'application/json' },
        }
      )
      .then((res) => {
        const nextAccess = res.data?.access as string | undefined;
        const nextRefresh = (res.data?.refresh as string | undefined) ?? refresh;
        if (!nextAccess) return null;
        saveTokens(nextAccess, nextRefresh);
        return nextAccess;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const origin = browserApiOrigin();
  if (origin) {
    config.baseURL = origin;
  }
  const t = getAccessToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config as (typeof err.config & { _retry?: boolean }) | undefined;

    if (err.response?.status === 401 && typeof window !== 'undefined' && original && !original._retry) {
      original._retry = true;
      const nextAccess = await tryRefreshAccessToken();
      if (nextAccess) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${nextAccess}`;
        return api(original);
      }

      clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export async function logoutApi() {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await api.post('/api/auth/logout/', { refresh });
    } catch {
      /* ignore */
    }
  }
  clearTokens();
}

export default api;
