import { type NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/features/marketplace/product-service';
import { apiSuccess, handleApiError } from '@/core/api/api-response';
import fs from 'fs';
import path from 'path';

import { auth } from '@clerk/nextjs/server';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';
import { ProductMutationSchema } from '@/lib/validation/schemas';

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
    const artisanId = searchParams.get('artisanId') || searchParams.get('artisan_id');

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

    if (artisanId) {
      const aid = artisanId.trim().toLowerCase();
      all = all.filter((p) => {
        const pAid = String(p.artisanId || p.artisan_id || '').trim().toLowerCase();
        return pAid === aid;
      });
    }

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
  const ip = getClientIp(req);

  // 1. Rate limiting on product creation
  const rateLimit = checkRateLimit(`product-post:${ip}`, SecurityRateLimits.PRODUCT_MUTATION);
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      path: '/api/products',
    });
    return NextResponse.json(
      { error: 'Too many product listing requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  try {
    // 2. Authentication and Role verification
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/products',
        details: { action: 'unauthenticated product creation' },
      });
      return NextResponse.json({ error: 'Unauthorized: Authentication required to list crafts' }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    // Allow verified artisans or admins
    if (role && role !== 'artisan' && role !== 'admin') {
      logSecurityEvent({
        type: 'RBAC_PRIVILEGE_VIOLATION',
        userId,
        ip,
        path: '/api/products',
        details: { role, attemptedAction: 'create product' },
      });
      return NextResponse.json(
        { error: 'Forbidden: Only verified artisans or admins may publish products' },
        { status: 403 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = ProductMutationSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid product data', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parseResult.data;

    // Enforce artisan ownership: an artisan can only list products under their own ID
    const assignedArtisanId = role === 'admin' && rawBody.artisanId ? String(rawBody.artisanId) : userId;

    const newProduct = {
      id: body.id || `creation-${Date.now()}`,
      artisanId: assignedArtisanId,
      name: body.name.trim(),
      description: body.description.trim(),
      originalLanguage: body.originalLanguage || 'Hindi',
      englishDescription: body.englishDescription || '',
      descriptions: { hi: body.description.trim() },
      price: body.price,
      currency: body.currency || 'INR',
      category: body.category,
      images: body.images,
      aiInsights: body.aiInsights || null,
      isActive: true,
      status: 'active',
      createdAt: new Date().toISOString(),
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
