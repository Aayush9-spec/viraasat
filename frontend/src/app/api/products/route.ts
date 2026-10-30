import crypto from 'node:crypto';
import { z } from 'zod';
import { check, database, failure, HttpError, identity, profile } from '@/lib/server/security';
import { type NextRequest, NextResponse } from 'next/server';
import { ProductService, mapProduct } from '@/features/marketplace/product-service';
import { apiSuccess, handleApiError } from '@/core/api/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('scope') === 'artisan') {
      const user = await identity();
      if (!['artisan', 'admin'].includes(user.role)) throw new HttpError(403, 'Approved artisan access required');
      const owner = await profile(user);
      const products = [];
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await database().from('products').select('*').eq('artisan_id', owner.id)
          .order('created_at', { ascending: false }).order('id').range(offset, offset + 99);
        check(error);
        products.push(...(data || []).map(mapProduct));
        if (!data || data.length < 100) break;
      }
      return apiSuccess({ products, total: products.length });
    }
    const category = searchParams.get('category');
    const query = searchParams.get('query');

    const dbProducts = await ProductService.getAllProducts();
    let all = dbProducts;

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
    if (error instanceof HttpError) return failure(error);
    return handleApiError(error, 'Failed to fetch products');
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await identity();
    if (!['artisan', 'admin'].includes(user.role)) throw new HttpError(403, 'Approved artisan access required');
    const owner = await profile(user);
    const parsed = z.object({
      id: z.string().optional(), name: z.string().trim().min(1).max(200),
      description: z.string().max(20000), price: z.number().positive().finite(),
      category: z.string().min(1), region: z.string().min(1), stock: z.number().int().min(0),
      images: z.array(z.string().max(14 * 1024 * 1024).refine(v => v.startsWith('/images/') || /^https:\/\//.test(v) || /^data:image\/(png|jpeg|webp);base64,/.test(v))).min(1).max(10),
      originalLanguage: z.string().optional(), englishDescription: z.string().optional(),
      descriptions: z.record(z.string()).optional(),
    }).safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, 'Invalid product details or image URLs');
    const input = parsed.data;
    const db = database();
    const images: string[] = [];
    for (const image of input.images) {
      if (!image.startsWith('data:')) { images.push(image); continue; }
      const [header, encoded] = image.split(',');
      const bytes = Buffer.from(encoded, 'base64');
      if (bytes.length > 10 * 1024 * 1024) throw new HttpError(400, 'Image exceeds 10 MB');
      const mime = header.slice(5, header.indexOf(';'));
      const key = `${owner.id}/${crypto.randomUUID()}.${mime.split('/')[1]}`;
      const { error } = await db.storage.from('product-images').upload(key, bytes, { contentType: mime, upsert: false });
      check(error);
      images.push(db.storage.from('product-images').getPublicUrl(key).data.publicUrl);
    }
    const row = { name: input.name, description: input.description, price: input.price,
      category: input.category, region: input.region, stock: input.stock, images,
      original_language: input.originalLanguage, english_description: input.englishDescription,
      descriptions: input.descriptions, is_active: true, artisan_id: owner.id };
    let query;
    if (input.id && z.string().uuid().safeParse(input.id).success) {
      const { data: existing, error } = await db.from('products').select('artisan_id,is_active').eq('id', input.id).maybeSingle();
      check(error);
      if (!existing) throw new HttpError(404, 'Product not found');
      if (existing.artisan_id !== owner.id && user.role !== 'admin') throw new HttpError(403, 'Not your product');
      query = db.from('products').update({ ...row, artisan_id: existing.artisan_id, is_active: existing.is_active }).eq('id', input.id).eq('artisan_id', existing.artisan_id);
    } else {
      query = db.from('products').insert(row);
    }
    const { data, error } = await query.select().single();
    check(error);
    return apiSuccess({ success: true, product: { ...data, artisanId: data.artisan_id } });
  } catch (e) { return failure(e); }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await identity();
    if (!['artisan','admin'].includes(user.role)) throw new HttpError(403,'Approved artisan access required');
    const parsed = z.object({id:z.string().uuid(),stock:z.number().int().min(0)}).strict().safeParse(await req.json());
    if(!parsed.success)throw new HttpError(400,'Invalid stock update');
    const owner=await profile(user);
    let query=database().from('products').update({stock:parsed.data.stock}).eq('id',parsed.data.id);
    if(user.role!=='admin')query=query.eq('artisan_id',owner.id);
    const {data,error}=await query.select('id').maybeSingle();check(error);
    if(!data)throw new HttpError(404,'Product not found');
    return NextResponse.json({success:true});
  }catch(e){return failure(e);}
}
