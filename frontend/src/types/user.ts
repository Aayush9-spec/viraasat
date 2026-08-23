import { Product } from './product';

export type User = {
  id: string;
  email: string;
  role: 'artisan' | 'buyer';
  cart: Product[];
  createdAt: string;
  lastLogin: string;
};
