import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Product } from '../../types';
import { colors } from '../../theme/colors';
import { useLocalization } from '../../context/LocalizationContext';
import { useCart } from '../../context/CartContext';

interface CraftCardProps {
  key?: string;
  product: Product;
  onPress: () => void;
}

export function CraftCard({ product, onPress }: CraftCardProps) {
  const { language, t } = useLocalization();
  const { addToCart } = useCart();

  const displayName = language === 'hi' && product.nameHi ? product.nameHi : product.name;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Product Image & Badges */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* GI Certification Tag */}
        {product.giCertified && (
          <View style={styles.giBadge}>
            <Text style={styles.giIcon}>🏛️</Text>
            <Text style={styles.giText}>GI Certified</Text>
          </View>
        )}

        {/* Region Tag */}
        <View style={styles.regionBadge}>
          <Text style={styles.regionText}>{product.region.split(',')[0]}</Text>
        </View>
      </View>

      {/* Craft Information */}
      <View style={styles.content}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {displayName}
        </Text>

        <View style={styles.artisanRow}>
          <Text style={styles.artisanIcon}>🧑‍🎨</Text>
          <Text style={styles.artisanName} numberOfLines={1}>
            {product.artisanName}
          </Text>
        </View>

        {/* Rating and Reviews */}
        <View style={styles.ratingRow}>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.ratingVal}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({product.reviewCount})</Text>
        </View>

        {/* Price & Action */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Direct Fair Wage</Text>
            <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(product)}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ {t('addToCart')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 190,
    backgroundColor: colors.parchmentDark,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  giBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.giBadgeBorder,
  },
  giIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  giText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.giBadgeText,
    letterSpacing: 0.4,
  },
  regionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(34, 28, 24, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  regionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FAF7F2',
  },
  content: {
    padding: 14,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.charcoal,
    lineHeight: 20,
    marginBottom: 6,
  },
  artisanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  artisanIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  artisanName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starIcon: {
    color: '#D97706',
    fontSize: 13,
    marginRight: 4,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.charcoal,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceLabel: {
    fontSize: 9,
    color: colors.success,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

