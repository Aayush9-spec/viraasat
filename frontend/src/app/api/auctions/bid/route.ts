import { NextResponse } from 'next/server';
import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { ServerAuctionService } from '@/features/auctions/services/auction-store';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';
import { AuctionBidSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Rate limiting on auction bids (15 per minute per IP to prevent bot sniping & DoS)
  const rateLimit = checkRateLimit(`auction-bid:${ip}`, SecurityRateLimits.AUCTION_BID);
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      path: '/api/auctions/bid',
    });
    return NextResponse.json(
      { success: false, error: 'Too many bidding attempts. Please wait before placing another bid.' },
      { status: 429 }
    );
  }

  try {
    // 2. Authentication enforcement: anonymous visitors cannot place real bids
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/auctions/bid',
        details: { action: 'unauthenticated auction bid' },
      });
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to participate in live artisan auctions.' },
        { status: 401 }
      );
    }

    const clerkUser = await clerkCurrentUser();
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;
    const userName = clerkUser?.fullName || clerkUser?.username || 'Verified Patron';
    const userRole = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role || 'collector';

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = AuctionBidSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid bid format', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { auctionId, amount } = parseResult.data;

    // 3. Atomically place bid with server validation
    const result = await ServerAuctionService.placeBid(auctionId, amount, {
      userId,
      email: userEmail,
      name: userName,
      role: userRole,
    });

    if (!result.success) {
      if (result.error?.includes('cannot bid on their own')) {
        logSecurityEvent({
          type: 'AUCTION_SELF_BID_ATTEMPT',
          userId,
          ip,
          path: '/api/auctions/bid',
          details: { auctionId, amount },
        });
      } else if (result.error?.includes('concluded')) {
        logSecurityEvent({
          type: 'AUCTION_EXPIRED_BID_ATTEMPT',
          userId,
          ip,
          path: '/api/auctions/bid',
          details: { auctionId, amount },
        });
      } else {
        logSecurityEvent({
          type: 'AUCTION_INVALID_BID',
          userId,
          ip,
          path: '/api/auctions/bid',
          details: { auctionId, amount, reason: result.error },
        });
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully and verified by the auction ledger.',
      auction: result.auction,
      bid: result.bid,
    });
  } catch (err) {
    console.error('[Auction Bid Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process auction bid.' },
      { status: 500 }
    );
  }
}
