import { ReviewService } from '../review-service';
import { NotificationService } from '@/features/notifications/notification-service';

// Mock Supabase calls so unit tests run deterministically in-memory without network timeouts
jest.mock('@/services/supabase', () => {
  const createChainableMock = () => {
    const chain: any = {
      select: jest.fn(() => chain),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => chain),
      delete: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      or: jest.fn(() => chain),
      order: jest.fn(() => chain),
      limit: jest.fn(() => chain),
      then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
    };
    return chain;
  };

  return {
    supabase: {
      from: jest.fn(() => createChainableMock()),
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      })),
      removeChannel: jest.fn(),
    },
  };
});

describe('Viraasat 2.0 Product Reviews & Ratings System', () => {
  // Use authentic catalog product from data.ts
  const TEST_PRODUCT_ID = 'prod-1';
  const TEST_CUSTOMER = {
    id: 'cust-user-9988',
    fullName: 'Ananya Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    role: 'buyer',
  };

  describe('1. Customer Review Submission & Validation', () => {
    it('successfully submits a valid 5-star customer review', async () => {
      const res = await ReviewService.createReview(
        {
          productId: TEST_PRODUCT_ID,
          rating: 5,
          title: 'Authentic Quartz Luster',
          comment: 'The blue glaze and intricate floral motifs are breathtaking! Highly recommend.',
        },
        TEST_CUSTOMER
      );

      expect(res.success).toBe(true);
      expect(res.review).toBeDefined();
      expect(res.review?.rating).toBe(5);
      expect(res.review?.reviewerId).toBe(TEST_CUSTOMER.id);
      expect(res.review?.reviewerName).toBe(TEST_CUSTOMER.fullName);
      expect(res.review?.productId).toBe(TEST_PRODUCT_ID);
      expect(res.review?.status).toBe('published');
    });

    it('rejects invalid rating values below 1 or above 5', async () => {
      const resLow = await ReviewService.createReview(
        {
          productId: TEST_PRODUCT_ID,
          rating: 0,
          comment: 'This rating is zero which is invalid in a 1-5 scale.',
        },
        TEST_CUSTOMER
      );
      expect(resLow.success).toBe(false);
      expect(resLow.error).toMatch(/between 1 and 5/i);

      const resHigh = await ReviewService.createReview(
        {
          productId: TEST_PRODUCT_ID,
          rating: 6,
          comment: 'This rating is six which exceeds the 5-star maximum.',
        },
        TEST_CUSTOMER
      );
      expect(resHigh.success).toBe(false);
      expect(resHigh.error).toMatch(/between 1 and 5/i);
    });

    it('rejects empty or very short review comments (< 5 chars)', async () => {
      const res = await ReviewService.createReview(
        {
          productId: TEST_PRODUCT_ID,
          rating: 4,
          comment: 'Hi',
        },
        TEST_CUSTOMER
      );
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/at least 5 characters/i);
    });

    it('rejects unauthenticated review submission', async () => {
      const res = await ReviewService.createReview(
        {
          productId: TEST_PRODUCT_ID,
          rating: 5,
          comment: 'Trying to submit without signing in as a valid customer.',
        },
        { id: '', fullName: '' }
      );
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Authentication required/i);
    });

    it('prevents duplicate reviews from the same customer for the same product without editing', async () => {
      const duplicateRes = await ReviewService.createReview(
        {
          productId: TEST_PRODUCT_ID,
          rating: 4,
          comment: 'Second review attempted for the same product by the same customer.',
        },
        TEST_CUSTOMER
      );
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.error).toMatch(/already submitted a review/i);
    });
  });

  describe('2. Review-to-Artisan Delivery & In-App Notifications', () => {
    it('dispatches an in-app notification to the artisan when a new review is submitted', async () => {
      const uniqueProdId = 'prod-2';
      const uniqueCustomer = {
        id: 'cust-unique-1234',
        fullName: 'Vikram Sengupta',
        role: 'buyer',
      };

      const res = await ReviewService.createReview(
        {
          productId: uniqueProdId,
          rating: 5,
          title: 'Vibrant Vegetable Dyes',
          comment: 'Safe lacquer craft for kids. Arrived safely packaged with GI lineage certificate.',
        },
        uniqueCustomer
      );

      expect(res.success).toBe(true);
      const artisanId = res.review?.artisanId;
      expect(artisanId).toBeTruthy();

      // Check that the artisan received an in-app notification
      const { notifications, unreadCount } = await NotificationService.getNotificationsForUser(
        artisanId!,
        'artisan'
      );
      expect(unreadCount).toBeGreaterThanOrEqual(1);
      const reviewNotif = notifications.find(
        (n) => n.type === 'new_review' && n.metadata?.productId === uniqueProdId
      );
      expect(reviewNotif).toBeDefined();
      expect(reviewNotif?.message).toContain('Vikram Sengupta');
      expect(reviewNotif?.read).toBe(false);
    });
  });

  describe('3. Artisan Responses & Customer Alerts', () => {
    it('allows the artisan to respond to a customer review and notifies customer', async () => {
      // Find the review created earlier
      const { reviews } = await ReviewService.getProductReviews(TEST_PRODUCT_ID);
      const review = reviews.find((r) => r.reviewerId === TEST_CUSTOMER.id);
      expect(review).toBeDefined();

      const artisanUser = {
        id: review!.artisanId || 'artisan-1',
        name: 'Master Riya Sharma & Guild',
        role: 'artisan',
      };

      const replyRes = await ReviewService.submitArtisanResponse(
        {
          reviewId: review!.id,
          response: 'Namaste Ananya Ji! Thank you for cherishing our traditional quartz pottery craft.',
        },
        artisanUser
      );

      expect(replyRes.success).toBe(true);

      // Verify the review now holds the artisan response
      const updated = await ReviewService.getProductReviews(TEST_PRODUCT_ID);
      const updatedReview = updated.reviews.find((r) => r.id === review!.id);
      expect(updatedReview?.artisanResponse).toContain('Namaste Ananya Ji');
      expect(updatedReview?.artisanRespondedAt).toBeTruthy();

      // Verify customer receives an in-app notification
      const custNotifs = await NotificationService.getNotificationsForUser(
        TEST_CUSTOMER.id,
        'customer'
      );
      const replyNotif = custNotifs.notifications.find(
        (n) => n.type === 'artisan_response' && n.metadata?.reviewId === review!.id
      );
      expect(replyNotif).toBeDefined();
      expect(replyNotif?.title).toContain('Artisan Replied');
      expect(replyNotif?.message).toContain('Master Riya Sharma & Guild');
    });

    it('rejects responses that are too short (< 3 chars)', async () => {
      const { reviews } = await ReviewService.getProductReviews(TEST_PRODUCT_ID);
      const review = reviews[0];

      const res = await ReviewService.submitArtisanResponse(
        {
          reviewId: review.id,
          response: 'Ok',
        },
        { id: review.artisanId || 'artisan-1', name: 'Artisan' }
      );

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/at least 3 characters/i);
    });

    it('prevents an unauthorized artisan from responding to another artisan’s review', async () => {
      const { reviews } = await ReviewService.getProductReviews(TEST_PRODUCT_ID);
      const review = reviews[0];

      const unauthorizedArtisan = {
        id: 'unauthorized-artisan-999',
        name: 'Imposter Craftsman',
        role: 'artisan',
      };

      const res = await ReviewService.submitArtisanResponse(
        {
          reviewId: review.id,
          response: 'I did not make this product but am attempting to respond.',
        },
        unauthorizedArtisan
      );

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });
  });

  describe('4. Rating Statistics & Distribution Aggregation', () => {
    it('correctly calculates average rating, total reviews, and distribution', async () => {
      const { stats, total } = await ReviewService.getProductReviews(TEST_PRODUCT_ID);

      expect(total).toBeGreaterThanOrEqual(1);
      expect(stats.averageRating).toBeGreaterThanOrEqual(1);
      expect(stats.averageRating).toBeLessThanOrEqual(5);
      expect(stats.distribution[5]).toBeGreaterThanOrEqual(1);
      expect(typeof stats.recommendedPercentage).toBe('number');
      expect(stats.recommendedPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.recommendedPercentage).toBeLessThanOrEqual(100);
    });

    it('returns empty distribution and 0 average rating for unreviewed products', async () => {
      const { reviews, stats, total } = await ReviewService.getProductReviews('prod-unreviewed-brand-new-999');

      expect(reviews.length).toBe(0);
      expect(total).toBe(0);
      expect(stats.averageRating).toBe(0);
      expect(stats.distribution[5]).toBe(0);
      expect(stats.distribution[1]).toBe(0);
      expect(stats.recommendedPercentage).toBe(0);
    });
  });

  describe('5. Review Deletion & Permissions', () => {
    it('prevents unauthorized users from deleting another customer’s review', async () => {
      const { reviews } = await ReviewService.getProductReviews(TEST_PRODUCT_ID);
      const target = reviews.find((r) => r.reviewerId === TEST_CUSTOMER.id);
      expect(target).toBeDefined();

      const unauthorizedRes = await ReviewService.deleteReview(
        target!.id,
        'stranger-user-456'
      );
      expect(unauthorizedRes.success).toBe(false);
      expect(unauthorizedRes.error).toMatch(/Unauthorized/i);
    });

    it('allows the customer to delete their own review', async () => {
      const { reviews } = await ReviewService.getProductReviews(TEST_PRODUCT_ID);
      const target = reviews.find((r) => r.reviewerId === TEST_CUSTOMER.id);
      expect(target).toBeDefined();

      const deleteRes = await ReviewService.deleteReview(
        target!.id,
        TEST_CUSTOMER.id
      );
      expect(deleteRes.success).toBe(true);

      // Verify the review is no longer in the published list
      const afterDelete = await ReviewService.getProductReviews(TEST_PRODUCT_ID);
      const found = afterDelete.reviews.find((r) => r.id === target!.id);
      expect(found).toBeUndefined();
    });
  });
});
