import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from './src/theme/colors';
import { Product } from './src/types';
import { ViraasatApiClient } from './src/api/client';
import { LocalizationProvider, useLocalization } from './src/context/LocalizationContext';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { Header } from './src/components/common/Header';
import { CraftCard } from './src/components/craft/CraftCard';
import { ProductDetailModal } from './src/components/craft/ProductDetailModal';
import { GIScannerModal } from './src/components/craft/GIScannerModal';
import { CartModal } from './src/components/craft/CartModal';
import { ArtisanStudioModal } from './src/components/artisan/ArtisanStudioModal';

const CATEGORIES = [
  'All Crafts',
  'Handloom Textiles',
  'Ceramics & Decor',
  'Metal Craft',
  'Traditional Art',
  'Woodcraft & Toys',
];

function MainAppContent() {
  const { t, language } = useLocalization();
  const { totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Crafts');

  // Modal Visibility States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [artisanStudioOpen, setArtisanStudioOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'explore' | 'scanner' | 'auctions' | 'cart'>('explore');

  useEffect(() => {
    ViraasatApiClient.getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === 'All Crafts' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !searchQuery ||
        p.name.toLowerCase().includes(q) ||
        (p.nameHi && p.nameHi.includes(q)) ||
        p.region.toLowerCase().includes(q) ||
        p.artisanName.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Branded Header */}
      <Header
        onOpenCart={() => setCartOpen(true)}
        onOpenArtisanStudio={() => setArtisanStudioOpen(true)}
      />

      {/* Main Content Area */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* GI Origin Banner & Quick AI Scan Callout */}
        <TouchableOpacity
          style={styles.scannerBanner}
          onPress={() => setScannerOpen(true)}
          activeOpacity={0.88}
        >
          <View style={styles.scannerIconWrapper}>
            <Text style={styles.scannerBannerIcon}>📷</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scannerBannerTitle}>AI Camera GI Hallmark Scanner</Text>
            <Text style={styles.scannerBannerDesc}>
              Scan physical handloom marks or craft seals to verify immutable blockchain provenance.
            </Text>
          </View>
          <Text style={styles.scannerBannerArrow}>→</Text>
        </TouchableOpacity>

        {/* Category Horizontal Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.selectedCategoryChip]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.selectedCategoryText,
                  ]}
                >
                  {cat === 'All Crafts' ? t('allCategories') : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Crafts Grid Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Master Artisan Heirloom Collection</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredProducts.length} certified GI-tagged crafts direct from rural guilds
            </Text>
          </View>
        </View>

        {/* Product Cards List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching living heritage from rural guilds...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏺</Text>
            <Text style={styles.emptyTitle}>No matching heritage craft found</Text>
            <Text style={styles.emptyDesc}>Try searching for another region, weave, or artisan name.</Text>
          </View>
        ) : (
          filteredProducts.map((prod) => (
            <CraftCard
              key={prod.id}
              product={prod}
              onPress={() => setSelectedProduct(prod)}
            />
          ))
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Bottom Navigation Tab Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('explore')}
        >
          <Text style={[styles.navIcon, currentTab === 'explore' && styles.activeNavIcon]}>🏺</Text>
          <Text style={[styles.navLabel, currentTab === 'explore' && styles.activeNavLabel]}>
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setCurrentTab('scanner');
            setScannerOpen(true);
          }}
        >
          <View style={styles.cameraPill}>
            <Text style={styles.cameraPillIcon}>📷</Text>
          </View>
          <Text style={styles.navLabel}>AI Scanner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setArtisanStudioOpen(true);
          }}
        >
          <Text style={styles.navIcon}>⚒️</Text>
          <Text style={styles.navLabel}>Studio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCartOpen(true)}
        >
          <View style={{ position: 'relative' }}>
            <Text style={styles.navIcon}>🛍️</Text>
            {totalItems > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{totalItems}</Text>
              </View>
            )}
          </View>
          <Text style={styles.navLabel}>Basket</Text>
        </TouchableOpacity>
      </View>

      {/* Product Detail Modal with Reviews Section */}
      <ProductDetailModal
        visible={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* AI GI Scanner Modal */}
      <GIScannerModal
        visible={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setCurrentTab('explore');
        }}
      />

      {/* Cart & Fair-Wage Checkout Modal */}
      <CartModal
        visible={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      {/* Artisan Studio & Review Inbox Modal */}
      <ArtisanStudioModal
        visible={artisanStudioOpen}
        onClose={() => setArtisanStudioOpen(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LocalizationProvider>
      <AuthProvider>
        <CartProvider>
          <MainAppContent />
        </CartProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  contentContainer: {
    padding: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    padding: 0,
  },
  clearSearch: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: 6,
  },
  scannerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  scannerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(197, 155, 75, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scannerBannerIcon: {
    fontSize: 20,
  },
  scannerBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.goldLight,
  },
  scannerBannerDesc: {
    fontSize: 11,
    color: '#D1D5DB',
    lineHeight: 15,
    marginTop: 2,
  },
  scannerBannerArrow: {
    fontSize: 18,
    color: colors.gold,
    fontWeight: '700',
    marginLeft: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContent: {
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.charcoal,
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.charcoal,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.charcoal,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  navIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  activeNavIcon: {
    transform: [{ scale: 1.1 }],
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeNavLabel: {
    color: colors.primary,
  },
  cameraPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraPillIcon: {
    fontSize: 18,
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  navBadgeText: {
    color: colors.charcoal,
    fontSize: 9,
    fontWeight: '800',
  },
});
