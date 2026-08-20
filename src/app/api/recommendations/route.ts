import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') || 'prod-1';
  
  // Call Python Backend Graph database recommendations endpoint
  try {
    const res = await fetch(`http://localhost:8000/api/blockchain/provenance/${productId}`);
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
