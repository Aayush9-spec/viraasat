import { type NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/features/marketplace/product-service';
import { apiSuccess, handleApiError } from '@/core/api/api-response';
import fs from 'fs';
import path from 'path';

function getStoredFileProducts(): any[] {
  const possiblePaths = [
    path.resolve(process.cwd(), '../database/products.json'),
    path.resolve(process.cwd(), 'database/products.json'),
    path.resolve('/Users/aayushkumarsingh/Desktop/viraasat/viraasat/database/products.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      } catch (e) {}
    }
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query = searchParams.get('query');

    const dbProducts = await ProductService.getAllProducts();
    const fileProducts = getStoredFileProducts();

    const map = new Map<string, any>();
    // Merge file products (latest additions) with dbProducts
    [...fileProducts, ...dbProducts].forEach((p) => {
      if (!p) return;
      const key = (p.name || '').trim().toLowerCase() || p.id;
      if (!map.has(key)) {
        map.set(key, { ...p, price: Number(p.price) || 0 });
      }
    });

    let all = Array.from(map.values());

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const newProduct = {
      id: body.id || `creation-${Date.now()}`,
      artisanId: body.artisanId || body.artisan_id || 'artisan-1',
      name: String(body.name).trim(),
      description: String(body.description || '').trim(),
      price: Number(body.price) || 0,
      currency: body.currency || 'INR',
      category: body.category || 'Home Decor',
      stock: Number(body.stock) || 10,
      images: Array.isArray(body.images) && body.images.length > 0 
        ? body.images 
        : ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=300'],
      region: body.region || 'Rajasthan',
      aiInsights: body.aiInsights || body.ai_insights || null,
      isActive: true,
      status: 'active',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist to database/products.json for backend search and models
    const possiblePaths = [
      path.resolve(process.cwd(), '../database/products.json'),
      path.resolve(process.cwd(), 'database/products.json'),
      path.resolve('/Users/aayushkumarsingh/Desktop/viraasat/viraasat/database/products.json'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        try {
          const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, 'utf-8');
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const idx = list.findIndex((x) => x.id === newProduct.id || (x.name && x.name.toLowerCase() === newProduct.name.toLowerCase()));
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...newProduct };
            } else {
              list.unshift(newProduct);
            }
            fs.writeFileSync(/*turbopackIgnore: true*/ p, JSON.stringify(list, null, 2), 'utf-8');
          }
        } catch (fileErr) {
          console.warn('Notice: Could not write to database/products.json at', p, fileErr);
        }
        break;
      }
    }

    return apiSuccess({ success: true, product: newProduct });
  } catch (error) {
    return handleApiError(error, 'Failed to save product');
  }
}
