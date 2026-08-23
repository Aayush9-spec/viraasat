import { NextResponse } from 'next/server';
import { ProductService } from '@/features/marketplace/product-service';

export async function GET() {
  const all = await ProductService.getAllProducts();
  return NextResponse.json({
    success: true,
    products: all
  });
}
