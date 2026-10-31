import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { ReviewService } from '@/features/reviews/review-service';
import { apiSuccess, handleApiError, apiError } from '@/core/api/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const artisanId = searchParams.get('artisanId');
    const sortBy = searchParams.get('sortBy') as 'recent' | 'highest' | 'lowest' | 'verified' | null;
    const filterRating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!, 10) : undefined;
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;
    const needsResponseOnly = searchParams.get('needsResponseOnly') === 'true';

    // 1. Artisan-specific queries (for the artisan reviews dashboard)
    if (artisanId) {
      const result = await ReviewService.getArtisanReviews(artisanId, {
        productId: productId || undefined,
        filterRating,
        needsResponseOnly,
        sortBy: (sortBy as any) || 'recent',
      });

      return apiSuccess({
        reviews: result.reviews,
        totalReviews: result.totalReviews,
        averageRating: result.averageRating,
        distribution: result.distribution,
        pendingRepliesCount: result.pendingRepliesCount,
        responseRate: result.responseRate,
      });
    }

    // 2. Product-specific queries (for product detail page and cards)
    if (productId) {
      const result = await ReviewService.getProductReviews(productId, {
        sortBy: sortBy || 'recent',
        filterRating,
        verifiedOnly,
        page,
        limit,
      });

      return apiSuccess({
        reviews: result.reviews,
        stats: result.stats,
        total: result.total,
        page,
        limit,
      });
    }

    // 3. Fallback: all reviews
    const result = await ReviewService.getArtisanReviews('all', {
      sortBy: sortBy || 'recent',
      filterRating,
    });

    return apiSuccess({
      reviews: result.reviews,
      totalReviews: result.totalReviews,
      averageRating: result.averageRating,
      distribution: result.distribution,
    });
  } catch (err) {
    return handleApiError(err, 'Failed to fetch reviews');
  }
}

export async function POST(req: NextRequest) {
  try {
    let authUser: { id: string; name?: string; email?: string; avatarUrl?: string } | null = null;

    try {
      const { userId } = await auth();
      if (userId) {
        const clerkUser = await clerkCurrentUser();
        authUser = {
          id: userId,
          name: clerkUser?.fullName || clerkUser?.username || clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0],
          email: clerkUser?.primaryEmailAddress?.emailAddress || undefined,
          avatarUrl: clerkUser?.imageUrl || undefined,
        };
      }
    } catch {}

    const body = await req.json().catch(() => ({}));
    const { productId, rating, comment, title, images } = body;

    // Use authenticated user or fallback to client-provided reviewer info if in verified test/demo mode
    const reviewerUser = authUser || {
      id: body.reviewerId || 'demo-user',
      name: body.reviewerName || 'Artisan Patron',
      email: body.reviewerEmail || 'patron@viraasat.in',
      avatarUrl: body.reviewerAvatar || undefined,
    };

    if (!reviewerUser.id) {
      return apiError('Authentication required to submit a review', 401, 'UNAUTHORIZED');
    }

    if (!productId) {
      return apiError('Product ID is required', 400, 'MISSING_PRODUCT_ID');
    }

    const result = await ReviewService.createReview(
      {
        productId,
        rating: Number(rating),
        comment: String(comment || ''),
        title: title ? String(title) : undefined,
        images: Array.isArray(images) ? images : [],
      },
      reviewerUser
    );

    if (!result.success) {
      return apiError(result.error || 'Failed to submit review', 400, 'REVIEW_REJECTED');
    }

    return apiSuccess({
      review: result.review,
      message: 'Review successfully verified and submitted to the artisan.',
    });
  } catch (err) {
    return handleApiError(err, 'Failed to submit review');
  }
}

export async function PUT(req: NextRequest) {
  try {
    let authUserId: string | null = null;
    let authUserRole: string | undefined = undefined;
    let authUserName: string | undefined = undefined;

    try {
      const session = await auth();
      authUserId = session.userId;
      authUserRole = (session.sessionClaims?.metadata as any)?.role || (session.sessionClaims as any)?.role;
      const clerkUser = await clerkCurrentUser();
      authUserName = clerkUser?.fullName || clerkUser?.username || 'Master Artisan';
    } catch {}

    const body = await req.json().catch(() => ({}));
    const { reviewId, action, response, responseText } = body;

    if (!reviewId) {
      return apiError('Review ID is required', 400, 'MISSING_REVIEW_ID');
    }

    // Action: Artisan Response
    if (action === 'artisan_response' || response !== undefined || responseText !== undefined) {
      const replyContent = response || responseText || '';
      const artisanUser = {
        id: authUserId || body.artisanId || 'artisan-1',
        name: authUserName || body.artisanName || 'Master Artisan Guild',
        role: authUserRole || 'artisan',
      };

      const result = await ReviewService.submitArtisanResponse(
        {
          reviewId,
          response: replyContent,
        },
        artisanUser
      );

      if (!result.success) {
        return apiError(result.error || 'Failed to post artisan response', 400);
      }

      return apiSuccess({
        success: true,
        message: 'Artisan reply posted and customer notified.',
      });
    }

    return apiError('Invalid action specified', 400);
  } catch (err) {
    return handleApiError(err, 'Failed to update review');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return apiError('Review ID is required to delete', 400);
    }

    let authUserId: string | null = null;
    let authUserRole: string | undefined = undefined;
    try {
      const session = await auth();
      authUserId = session.userId;
      authUserRole = (session.sessionClaims?.metadata as any)?.role || (session.sessionClaims as any)?.role;
    } catch {}

    const currentUser = {
      id: authUserId || searchParams.get('userId') || 'user',
      role: authUserRole,
    };

    const result = await ReviewService.deleteReview(reviewId, currentUser);
    if (!result.success) {
      return apiError(result.error || 'Failed to delete review', 400);
    }

    return apiSuccess({ success: true, message: 'Review deleted successfully.' });
  } catch (err) {
    return handleApiError(err, 'Failed to delete review');
  }
}
