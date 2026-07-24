import { API_URL } from './config';
import { getStoredToken } from './token';

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

let onUnauthorized: (() => void) | null = null;

/**
 * Registered once by App.tsx. Fires whenever any request comes back 401,
 * so a token that's gone stale mid-session (backend AUTH_SECRET rotated,
 * pointed at a different backend, revoked, etc.) signs the user out
 * instead of leaving every screen stuck retrying a doomed request.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T; meta?: ApiMeta }> {
  const token = await getStoredToken();
  const { method = 'GET', body } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return { data: undefined as T };
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      onUnauthorized?.();
    }
    throw new ApiError(
      response.status,
      json?.error?.message ?? 'Request failed',
      json?.error?.code
    );
  }

  return { data: json?.data as T, meta: json?.meta };
}

/**
 * The single chokepoint every mobile screen goes through to reach the
 * shared apps/web REST API. Attaches the stored bearer token automatically;
 * every call is relative to EXPO_PUBLIC_API_URL (see ./config).
 */
export const api = {
  async get<T>(path: string): Promise<T> {
    const { data } = await request<T>(path, { method: 'GET' });
    return data;
  },
  async getWithMeta<T>(path: string): Promise<{ data: T; meta?: ApiMeta }> {
    return request<T>(path, { method: 'GET' });
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    const { data } = await request<T>(path, { method: 'POST', body });
    return data;
  },
  async patch<T>(path: string, body?: unknown): Promise<T> {
    const { data } = await request<T>(path, { method: 'PATCH', body });
    return data;
  },
  async delete<T>(path: string): Promise<T> {
    const { data } = await request<T>(path, { method: 'DELETE' });
    return data;
  },
};
