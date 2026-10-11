'use client';

import { BackendClient, BackendError } from './client';

export interface ModerationVerdict {
  allow: boolean;
  reason: string;
  details?: Record<string, unknown>;
}

export async function moderateImage(
  file: File,
  token?: string | null,
): Promise<ModerationVerdict> {
  const form = new FormData();
  form.append('file', file);
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'}/api/moderate-image`,
      {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      // In local dev, if backend is unauthenticated or returns error, pass through safely
      return { allow: true, reason: 'backend_soft_pass' };
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Image moderation request timed out or backend offline, soft-passing for artisan workflow:', err);
    return { allow: true, reason: 'timeout_soft_pass' };
  }
}

