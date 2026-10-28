/**
 * Central application constants.
 */

export const STORAGE_KEYS = {
  CART: 'viraasat-cart',
  WISHLIST: 'viraasat-wishlist',
  SESSION_ROLE: 'viraasat_session_role',
  SESSION_UID: 'viraasat_session_uid',
  ADMIN_VERIFIED: 'viraasat_admin_verified',
  THEME: 'theme',
  LOCALE: 'viraasat_locale',
} as const;

export const USER_ROLES = {
  BUYER: 'buyer',
  ARTISAN: 'artisan',
  ADMIN: 'admin',
} as const;

export const DEFAULT_CURRENCY = 'INR';

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
