import { NextResponse } from 'next/server';
import { ServerAuctionService } from '@/features/auctions/services/auction-store';
import { apiSuccess, handleApiError } from '@/core/api/api-response';

export const runtime = 'nodejs';

/**
 * GET /api/auctions - Returns all active live auctions with latest bids
 */
export async function GET() {
  try {
    const auctions = await ServerAuctionService.getAllAuctionsAsync();
    return apiSuccess({
      auctions,
      total: auctions.length,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch active auctions');
  }
}
