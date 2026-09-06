import { Product } from './product';

export type UserRole = 'buyer' | 'artisan' | 'admin';

export type User = {
  id: string;
  clerkUserId?: string;
  uid?: string;
  name?: string;
  email: string;
  imageUrl?: string;
  role: UserRole;
  cart?: Product[];
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
};

