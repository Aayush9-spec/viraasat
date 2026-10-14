import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=300';

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
