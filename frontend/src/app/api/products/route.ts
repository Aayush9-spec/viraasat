import { type NextRequest } from 'next/server';
import { ProductService } from '@/features/marketplace/product-service';
import { apiSuccess, handleApiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query = searchParams.get('query');

    let all = await ProductService.getAllProducts();

    if (category) {
      all = all.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
    }

    if (query) {
      const q = query.toLowerCase();
      all = all.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.region?.toLowerCase().includes(q)
      );
    }

    return apiSuccess({ products: all, total: all.length });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch products');
  }
}
