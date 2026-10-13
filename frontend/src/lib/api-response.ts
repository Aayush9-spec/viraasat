import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';

/**
 * Standardized success response constructor for Next.js Route Handlers.
 */
export function apiSuccess<T>(data: T, status = 200, message?: string) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  return NextResponse.json(body, { status });
}

/**
 * Standardized error response constructor for Next.js Route Handlers.
 */
export function apiError(
  message: string,
  status = 500,
  code?: string,
  details?: unknown
) {
  const body: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      status,
      details,
    },
  };
  return NextResponse.json(body, { status });
}

/**
 * Global API route error catcher with status resolution.
 */
export function handleApiError(error: unknown, fallbackMessage = 'Internal Server Error') {
  console.error('[API Error]:', error);

  if (error instanceof Error) {
    return apiError(error.message || fallbackMessage, 500, 'INTERNAL_SERVER_ERROR');
  }

  return apiError(fallbackMessage, 500, 'UNKNOWN_ERROR', error);
}
