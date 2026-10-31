export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  images?: string[];
  artisanId?: string;
  orderItemId?: string;
  isVerifiedPurchase: boolean;
  artisanResponse?: string;
  artisanRespondedAt?: string;
  status?: 'published' | 'flagged' | 'hidden';
  createdAt: string;
  updatedAt?: string;
}

export interface RatingDistribution {
  [rating: number]: number;
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
  verifiedPurchasesCount: number;
  recommendedPercentage: number;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  comment: string;
  title?: string;
  images?: string[];
}

export interface UpdateReviewInput {
  reviewId: string;
  rating?: number;
  comment?: string;
  title?: string;
  images?: string[];
}

export interface ArtisanResponseInput {
  reviewId: string;
  response: string;
}
