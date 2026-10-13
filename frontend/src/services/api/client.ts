import { env } from '@/config/env';
import type { ApiResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const base = this.baseUrl ? `${this.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}` : endpoint;
    if (!params) return base;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${base}?${queryString}` : base;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = 15000, params, headers: customHeaders, ...fetchInit } = options;
    const url = this.buildUrl(endpoint, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = new Headers(customHeaders);
    if (!headers.has('Content-Type') && !(fetchInit.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, {
        ...fetchInit,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorInfo = isJson && typeof data === 'object' && data !== null
          ? (data as { error?: { message?: string; code?: string; details?: unknown } | string; message?: string })
          : null;

        const message =
          (typeof errorInfo?.error === 'string' && errorInfo.error) ||
          (typeof errorInfo?.error === 'object' && errorInfo?.error?.message) ||
          errorInfo?.message ||
          response.statusText ||
          `Request failed with status ${response.status}`;

        const code = (typeof errorInfo?.error === 'object' && errorInfo?.error?.code) || `HTTP_${response.status}`;
        const details = typeof errorInfo?.error === 'object' ? errorInfo?.error?.details : data;

        throw new ApiError(response.status, message, code, details);
      }

      return data as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(408, 'Request timed out. Please check your network connection.', 'REQUEST_TIMEOUT');
      }

      const message = err instanceof Error ? err.message : 'A network error occurred. Please try again.';
      throw new ApiError(0, message, 'NETWORK_ERROR', err);
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Default internal API client for Next.js App Router /api endpoints.
 */
export const apiClient = new ApiClient('/api');

/**
 * Dedicated client for Python FastAPI backend endpoints.
 */
export const backendApiClient = new ApiClient(env.backend.url);
