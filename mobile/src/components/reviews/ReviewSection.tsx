import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Review } from '../../types';
import { colors } from '../../theme/colors';

interface ReviewSectionProps {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  onOpenWriteReview: () => void;
}

export function ReviewSection({
  reviews,
  rating,
  reviewCount,
  onOpenWriteReview,
}: ReviewSectionProps) {
  // Compute star distribution from actual review records
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { stars, count, percent };
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Patron Reviews & Ratings</Text>
          <Text style={styles.subtitle}>Verified authentic Indian handicraft feedback</Text>
        </View>

        <TouchableOpacity
          style={styles.writeButton}
          onPress={onOpenWriteReview}
          activeOpacity={0.8}
        >
          <Text style={styles.writeButtonText}>+ Write Review</Text>
        </TouchableOpacity>
      </View>

      {/* Aggregate Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreLeft}>
          <Text style={styles.bigScore}>{rating.toFixed(1)}</Text>
          <View style={styles.starRow}>
            {'★'.repeat(Math.round(rating)).padEnd(5, '☆').split('').map((star, idx) => (
              <Text key={idx} style={styles.goldStar}>{star}</Text>
            ))}
          </View>
          <Text style={styles.totalReviews}>{reviewCount} Total Reviews</Text>
        </View>

        {/* Rating Breakdown Bars */}
        <View style={styles.breakdownContainer}>
          {distribution.map(({ stars, count, percent }) => (
            <View key={stars} style={styles.distRow}>
              <Text style={styles.distLabel}>{stars}★</Text>
              <View style={styles.distBarBg}>
                <View style={[styles.distBarFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.distCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyText}>Be the first heritage connoisseur to review this masterpiece.</Text>
        </View>
      ) : (
        reviews.map((rev) => (
          <View key={rev.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.avatarPill}>
                <Text style={styles.avatarLetter}>{rev.customerName[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.customerName}>{rev.customerName}</Text>
                  {rev.verifiedPurchase && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedCheck}>✓</Text>
                      <Text style={styles.verifiedText}>Verified Patron</Text>
                    </View>
                  )}
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.stars}>{'★'.repeat(rev.rating)}</Text>
                  <Text style={styles.reviewDate}>• {rev.createdAt}</Text>
                </View>
              </View>
            </View>

            {rev.title && <Text style={styles.reviewTitle}>{rev.title}</Text>}
            <Text style={styles.reviewComment}>{rev.comment}</Text>

            {/* Artisan Direct Response Box */}
            {rev.artisanResponse && (
              <View style={styles.artisanReplyBox}>
                <View style={styles.artisanReplyHeader}>
                  <Text style={styles.guildIcon}>🏛️</Text>
                  <Text style={styles.artisanReplyTitle}>Master Artisan Guild Response</Text>
                  <Text style={styles.artisanReplyDate}>{rev.artisanResponse.respondedAt}</Text>
                </View>
                <Text style={styles.artisanReplyText}>{rev.artisanResponse.text}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  writeButton: {
    backgroundColor: 'rgba(112, 29, 36, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  writeButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: colors.parchment,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLeft: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    minWidth: 100,
  },
  bigScore: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  starRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  goldStar: {
    color: '#D97706',
    fontSize: 14,
  },
  totalReviews: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  breakdownContainer: {
    flex: 1,
    paddingLeft: 14,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  distLabel: {
    width: 22,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  distBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  distCount: {
    width: 18,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedCheck: {
    fontSize: 9,
    color: colors.success,
    fontWeight: '900',
    marginRight: 2,
  },
  verifiedText: {
    fontSize: 9,
    color: colors.success,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  stars: {
    color: '#D97706',
    fontSize: 12,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 6,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  artisanReplyBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(197, 155, 75, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  artisanReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  guildIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  artisanReplyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldMuted,
    flex: 1,
  },
  artisanReplyDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  artisanReplyText: {
    fontSize: 12,
    color: colors.charcoal,
    fontStyle: 'italic',
  },
});

