'use client';

import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { BACKEND_URL, BackendError } from '@/services/backend/client';

export interface UseBackendResult {
  get: <T = unknown>(endpoint: string) => Promise<T>;
  post: <T = unknown>(endpoint: string, data: unknown) => Promise<T>;
}

export function useBackend(): UseBackendResult {
  const { getToken } = useAuth();

  const request = useCallback(
    async (endpoint: string, init: RequestInit = {}) => {
      const token = getToken ? await getToken() : null;
      const headers = new Headers(init.headers);
      headers.set('Content-Type', 'application/json');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...init,
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        let detail: unknown = response.statusText;
        try {
          detail = await response.json();
        } catch {
          // ignore
        }
        throw new BackendError(response.status, detail);
      }

      return response.json();
    },
    [getToken],
  );

  const get = useCallback(
    <T>(endpoint: string) => request(endpoint, { method: 'GET' }) as Promise<T>,
    [request],
  );

  const post = useCallback(
    <T>(endpoint: string, data: unknown) =>
      request(endpoint, { method: 'POST', body: JSON.stringify(data) }) as Promise<T>,
    [request],
  );

  return { get, post };
}