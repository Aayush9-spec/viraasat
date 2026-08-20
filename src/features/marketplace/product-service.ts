import { products } from '@/lib/data';
import type { Product } from '@/lib/types';

export class ProductService {
  static getAllProducts(): Product[] {
    return products;
  }

  static getProductById(id: string): Product | undefined {
    return products.find(p => p.id === id);
  }

  static getProductsByCategory(category: string): Product[] {
    return products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  static searchProducts(query: string): Product[] {
    const q = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) || 
      p.region.toLowerCase().includes(q)
    );
  }
}
