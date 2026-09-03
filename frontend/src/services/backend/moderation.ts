'use client';

import { BackendClient, BackendError } from './client';

export interface ModerationVerdict {
  allow: boolean;
  reason: string;
  details?: Record<string, unknown>;
}

export async function moderateImage(file: File): Promise<ModerationVerdict> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'}/api/moderate-image`, {
    method: 'POST',
    body: form,
    // Don't set Content-Type; the browser will set the boundary.
    // We can't use BackendClient here because it JSON-encodes.
  });
  if (!res.ok) {
    let detail: unknown = res.statusText;
    try { detail = await res.json(); } catch { /* ignore */ }
    throw new BackendError(res.status, detail);
  }
  return res.json();
}
