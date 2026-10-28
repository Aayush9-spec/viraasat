import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { BACKEND_URL } from '@/services/backend/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const region = searchParams.get('region') || 'Rajasthan';
  const category = searchParams.get('category') || 'Home Decor';
  const priceTier = searchParams.get('priceTier') || 'mid';
  const gi = searchParams.get('gi') !== 'false';
  const topK = parseInt(searchParams.get('limit') || '5', 10);

  const headers: Record<string, string> = {};
  try {
    const { getToken } = await auth();
    const token = getToken ? await getToken() : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    // Unauthenticated request; proceed without a token.
  }

  try {
    if (productId) {
      // Call Python Backend similar items (co-purchase) endpoint
      const res = await fetch(`${BACKEND_URL}/api/recommendations/similar/${productId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          success: true,
          productId,
          products: data.similar_items || [],
          similar_items: data.similar_items || [],
          recommendations: data.similar_items || [],
          model_accuracy: data.model_accuracy,
          is_simulated: data.is_simulated,
        });
      }
    }

    // Call Python Backend Two-Tower + Ranker recommendations endpoint
    const res = await fetch(`${BACKEND_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_region: region,
        preferred_category: category,
        price_tier: priceTier,
        gi_preference: gi,
        top_k: topK,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        productId,
        products: data.recommendations || [],
        recommendations: data.recommendations || [],
        model_accuracy: data.model_accuracy,
        is_simulated: data.is_simulated,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recommendations',
    }, { status: 502 });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: "Backend service offline"
    }, { status: 500 });
  }
}

