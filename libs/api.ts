import axios, { AxiosError } from 'axios';
import { clearToken, getToken } from './session';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // An expired or rejected token is unrecoverable: drop it and send the user
    // back to sign-in instead of letting every page fail silently.
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearToken();
      if (window.location.pathname !== '/') {
        window.location.href = '/?error=session_expired';
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Pulls the human-readable message out of a Nest error response.
 * Nest sends `message` as either a string or an array of validation errors.
 */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string | string[] })?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default api;
