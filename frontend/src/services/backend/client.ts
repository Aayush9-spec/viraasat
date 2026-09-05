export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://viraasat-backend-f0c1.onrender.com';

export class BackendClient {
  static async get(endpoint: string, init?: RequestInit) {
    return BackendClient.request(endpoint, { ...init, method: 'GET' });
  }

  static async post(endpoint: string, data: unknown, init?: RequestInit) {
    return BackendClient.request(endpoint, {
      ...init,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  private static async request(endpoint: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');

    // Attach Clerk token if executing on Next.js server
    if (typeof window === 'undefined') {
      try {
        const { auth } = await import('@clerk/nextjs/server');
        const authObj = await auth();
        if (authObj && authObj.getToken) {
          const token = await authObj.getToken();
          if (token) headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // Not in server context or token unavailable
      }
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
  }
}

export class BackendError extends Error {
  constructor(public status: number, public detail: unknown) {
    super(`Backend error ${status}: ${JSON.stringify(detail)}`);
  }
}
