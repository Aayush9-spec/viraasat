import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { BACKEND_URL } from '@/services/backend/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') || 'prod-1';

  const headers: Record<string, string> = {};
  try {
    const { getToken } = await auth();
    const token = getToken ? await getToken() : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    // Unauthenticated request; proceed without a token.
  }

  // Call Python Backend Graph database recommendations endpoint
  try {
    const res = await fetch(`${BACKEND_URL}/api/blockchain/provenance/${productId}`, { headers });
    const data = await res.ok ? await res.json() : null;
    return NextResponse.json({
      success: true,
      productId: productId,
      recommendations: data || []
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: "Backend service offline"
    }, { status: 500 });
  }
}
