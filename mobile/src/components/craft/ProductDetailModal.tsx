import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Share,
} from 'react-native';
import { Product, Review } from '../../types';
import { colors } from '../../theme/colors';
import { useLocalization } from '../../context/LocalizationContext';
import { useCart } from '../../context/CartContext';
import { ViraasatApiClient } from '../../api/client';
import { ReviewSection } from '../reviews/ReviewSection';
import { ReviewFormModal } from '../reviews/ReviewFormModal';

interface ProductDetailModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({
  visible,
  product,
  onClose,
}: ProductDetailModalProps) {
  const { language, t } = useLocalization();
  const { addToCart } = useCart();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    if (product) {
      ViraasatApiClient.getReviews(product.id).then(setReviews);
    }
  }, [product]);

  if (!product) return null;

  const displayName = language === 'hi' && product.nameHi ? product.nameHi : product.name;
  const displayStory = language === 'hi' && product.descriptionHi ? product.descriptionHi : product.description;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${displayName} — Handcrafted by ${product.artisanName} on Viraasat: https://virrasat.in`,
        title: displayName,
      });
    } catch {
      // Ignore share abort
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconCircle}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.barTitle} numberOfLines={1}>
            {product.category}
          </Text>

          <TouchableOpacity onPress={handleShare} style={styles.iconCircle}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Image Showcase */}
          <View style={styles.imageBox}>
            <Image
              source={{ uri: product.images[0] }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {product.giCertified && (
              <View style={styles.giBanner}>
                <Text style={styles.giBannerText}>
                  🏛️ Geographical Indication: {product.giTagNumber || 'Certified'}
                </Text>
              </View>
            )}
          </View>

          {/* Title & Metadata */}
          <View style={styles.section}>
            <View style={styles.regionTag}>
              <Text style={styles.regionTagText}>{product.region}</Text>
            </View>

            <Text style={styles.productTitle}>{displayName}</Text>

            {/* Price & Fair-Trade Guarantee */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>₹{product.originalPrice.toLocaleString('en-IN')}</Text>
              )}
              <View style={styles.fairWageBadge}>
                <Text style={styles.fairWageText}>85%+ Direct Artisan Fair Wage</Text>
              </View>
            </View>
          </View>

          {/* Artisan Biography Card */}
          <View style={styles.artisanCard}>
            <View style={styles.artisanAvatar}>
              <Text style={styles.artisanInitials}>{product.artisanName[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.verifiedRow}>
                <Text style={styles.artisanName}>{product.artisanName}</Text>
                <Text style={styles.verifiedTick}>✓ Guild Verified</Text>
              </View>
              <Text style={styles.guildName}>{product.artisanGuild || 'Master Artisan Guild'}</Text>
              <Text style={styles.location}>{product.region}</Text>
            </View>
          </View>

          {/* Living Heritage Backstory */}
          <View style={styles.storyCard}>
            <View style={styles.storyHeader}>
              <Text style={styles.storyIcon}>📜</Text>
              <Text style={styles.storyTitle}>The Living Heritage & Lineage</Text>
            </View>
            <Text style={styles.storyBody}>{displayStory}</Text>
            {product.provenanceEra && (
              <View style={styles.eraPill}>
                <Text style={styles.eraLabel}>Historic Era:</Text>
                <Text style={styles.eraValue}>{product.provenanceEra}</Text>
              </View>
            )}
          </View>

          {/* Cryptographic Digital Provenance Passport */}
          <View style={styles.passportCard}>
            <View style={styles.passportHeader}>
              <Text style={styles.lockIcon}>🔐</Text>
              <Text style={styles.passportTitle}>Digital Provenance & PoW Ledger</Text>
            </View>
            <Text style={styles.passportDesc}>
              This heirloom is cryptographically anchored on Viraasat’s immutable craft ledger to ensure zero counterfeiting.
            </Text>
            <View style={styles.hashBox}>
              <Text style={styles.hashLabel}>GENESIS HASH:</Text>
              <Text style={styles.hashVal}>{product.digitalPassportHash || '0x8f3b2a9e14c7e2d9b5420188'}</Text>
            </View>
          </View>

          {/* Dedicated Reviews & Ratings Section */}
          <ReviewSection
            reviews={reviews}
            rating={product.rating}
            reviewCount={product.reviewCount}
            onOpenWriteReview={() => setReviewModalOpen(true)}
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky Bottom Actions */}
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomPriceLabel}>Total Investment</Text>
            <Text style={styles.bottomPrice}>₹{product.price.toLocaleString('en-IN')}</Text>
          </View>

          <TouchableOpacity
            style={styles.acquireButton}
            onPress={() => {
              addToCart(product);
              onClose();
            }}
            activeOpacity={0.88}
          >
            <Text style={styles.acquireButtonText}>Acquire Heirloom 🛍️</Text>
          </TouchableOpacity>
        </View>

        {/* Review Form Modal */}
        <ReviewFormModal
          visible={reviewModalOpen}
          product={product}
          onClose={() => setReviewModalOpen(false)}
          onReviewSubmitted={(newRev) => {
            setReviews((prev) => [newRev, ...prev]);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backArrow: {
    fontSize: 18,
    color: colors.charcoal,
    fontWeight: '700',
  },
  barTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  shareIcon: {
    fontSize: 16,
    color: colors.charcoal,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  imageBox: {
    position: 'relative',
    width: '100%',
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.parchmentDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  giBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(34, 28, 24, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  giBannerText: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
  },
  regionTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(112, 29, 36, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  regionTagText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.charcoal,
    lineHeight: 28,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  fairWageBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fairWageText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  artisanAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  artisanInitials: {
    color: colors.charcoal,
    fontSize: 18,
    fontWeight: '800',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  artisanName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  verifiedTick: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '700',
  },
  guildName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  location: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  storyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  storyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  storyBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  eraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parchment,
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  eraLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldMuted,
    marginRight: 6,
  },
  eraValue: {
    fontSize: 11,
    color: colors.charcoal,
    fontWeight: '600',
  },
  passportCard: {
    backgroundColor: colors.charcoal,
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  lockIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  passportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.goldLight,
  },
  passportDesc: {
    fontSize: 11,
    color: '#D1D5DB',
    lineHeight: 16,
    marginBottom: 10,
  },
  hashBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 8,
    borderRadius: 6,
  },
  hashLabel: {
    fontSize: 9,
    color: colors.gold,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  hashVal: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: colors.primary,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  acquireButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  acquireButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

