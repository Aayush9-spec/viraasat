import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEFAULT_PRODUCT_IMAGE = '/images/products/clean/handcrafted-terracotta-diya.jpg';

export function getProductImage(images?: (string | undefined | null)[] | string): string {
  if (typeof images === 'string' && images.trim().length > 0) {
    return images.trim();
  }
  if (Array.isArray(images)) {
    const found = images.find((img) => typeof img === 'string' && img.trim().length > 0);
    if (found) return found.trim();
  }
  return DEFAULT_PRODUCT_IMAGE;
}
