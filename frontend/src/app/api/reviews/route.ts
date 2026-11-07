import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { ReviewService } from '@/features/reviews/review-service';
import { apiSuccess, handleApiError, apiError } from '@/core/api/api-response';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';
import { CreateReviewSchema, ArtisanReplySchema } from '@/lib/validation/schemas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const artisanId = searchParams.get('artisanId');
    const reviewerId = searchParams.get('reviewerId') || searchParams.get('customerId');
    const sortBy = searchParams.get('sortBy') as 'recent' | 'highest' | 'lowest' | 'verified' | null;
    const filterRating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!, 10) : undefined;
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;
    const needsResponseOnly = searchParams.get('needsResponseOnly') === 'true';

    // 0. Customer-specific query (for customer dashboard reviews section)
    if (reviewerId) {
      const customerReviews = await ReviewService.getCustomerReviews(reviewerId);
      return apiSuccess({
        reviews: customerReviews,
        total: customerReviews.length,
      });
    }

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
  const ip = getClientIp(req);

  // Rate limiting on review submissions
  const rateLimit = checkRateLimit(`review-post:${ip}`, SecurityRateLimits.REVIEW_SUBMISSION);
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      path: '/api/reviews',
    });
    return apiError('Too many review submissions. Please wait a moment.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/reviews',
        details: { action: 'unauthenticated review submission' },
      });
      return apiError('Authentication required to submit a verified craft review', 401, 'UNAUTHORIZED');
    }

    const clerkUser = await clerkCurrentUser();
    const reviewerUser = {
      id: userId,
      name: clerkUser?.fullName || clerkUser?.username || clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Artisan Patron',
      email: clerkUser?.primaryEmailAddress?.emailAddress || undefined,
      avatarUrl: clerkUser?.imageUrl || undefined,
    };

    const rawBody = await req.json().catch(() => ({}));

    if (!rawBody.productId) {
      return apiError('Product ID is required', 400, 'MISSING_PRODUCT_ID');
    }
    if (typeof rawBody.rating === 'number' && (rawBody.rating < 1 || rawBody.rating > 5)) {
      return apiError('Rating must be between 1 and 5 stars', 400, 'INVALID_RATING');
    }

    const parseResult = CreateReviewSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid review data';
      return apiError(firstError, 400, 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }

    const { productId, rating, comment, title, images } = parseResult.data;

    const result = await ReviewService.createReview(
      {
        productId,
        rating,
        comment: comment.trim(),
        title: title ? title.trim() : undefined,
        images: images || [],
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
  const ip = getClientIp(req);

  try {
    const session = await auth();
    const authUserId = session.userId;
    const authUserRole = (session.sessionClaims?.metadata as any)?.role || (session.sessionClaims as any)?.role;

    if (!authUserId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/reviews',
        details: { action: 'unauthenticated review mutation' },
      });
      return apiError('Authentication required to modify reviews or post artisan replies', 401, 'UNAUTHORIZED');
    }

    const clerkUser = await clerkCurrentUser();
    const authUserName = clerkUser?.fullName || clerkUser?.username || 'Master Artisan';

    const body = await req.json().catch(() => ({}));
    const { reviewId, action, response, responseText } = body;

    if (!reviewId) {
      return apiError('Review ID is required', 400, 'MISSING_REVIEW_ID');
    }

    // Action: Artisan Response
    if (action === 'artisan_response' || response !== undefined || responseText !== undefined) {
      // Role enforcement: only artisans or admins can reply to reviews
      if (authUserRole && authUserRole !== 'artisan' && authUserRole !== 'admin') {
        logSecurityEvent({
          type: 'RBAC_PRIVILEGE_VIOLATION',
          userId: authUserId,
          ip,
          path: '/api/reviews',
          details: { role: authUserRole, attemptedAction: 'artisan review reply' },
        });
        return apiError('Only artisans or administrators can post official craft replies', 403, 'FORBIDDEN');
      }

      const replyContent = (response || responseText || '').trim();
      if (!replyContent) {
        return apiError('Response content cannot be empty', 400, 'EMPTY_RESPONSE');
      }

      const artisanUser = {
        id: authUserId,
        name: authUserName,
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

    // Action: Customer Edit Review
    if (action === 'edit_review' || action === 'update') {
      const result = await ReviewService.updateReview(
        {
          reviewId,
          rating: body.rating,
          comment: body.comment ? String(body.comment).trim() : undefined,
          title: body.title ? String(body.title).trim() : undefined,
          images: body.images,
        },
        {
          id: authUserId,
          role: authUserRole,
        }
      );

      if (!result.success) {
        return apiError(result.error || 'Failed to update review', 400);
      }

      return apiSuccess({
        success: true,
        review: result.review,
        message: 'Review updated successfully.',
      });
    }

    return apiError('Invalid action specified', 400);
  } catch (err) {
    return handleApiError(err, 'Failed to update review');
  }
}

export async function DELETE(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return apiError('Review ID is required to delete', 400);
    }

    const session = await auth();
    const authUserId = session.userId;
    const authUserRole = (session.sessionClaims?.metadata as any)?.role || (session.sessionClaims as any)?.role;

    if (!authUserId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/reviews',
        details: { action: 'unauthenticated review deletion' },
      });
      return apiError('Authentication required to delete a review', 401, 'UNAUTHORIZED');
    }

    const currentUser = {
      id: authUserId,
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
