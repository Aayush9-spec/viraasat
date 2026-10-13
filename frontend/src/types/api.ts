/**
 * Standard API request and response data structures.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorDetail;
  message?: string;
}

export interface ApiErrorDetail {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailResponse {
  success: false;
  error: ApiErrorDetail;
}
