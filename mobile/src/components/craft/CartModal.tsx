import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import { useLocalization } from '../../context/LocalizationContext';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CartModal({ visible, onClose }: CartModalProps) {
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount, fairWageDirectAmount, totalItems } = useCart();
  const { t } = useLocalization();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = () => {
    if (items.length === 0) return;
    setCheckingOut(true);

    // Simulate instant UPI / Razorpay payment intent
    setTimeout(() => {
      setCheckingOut(false);
      Alert.alert(
        'Order Placed Successfully! 🌺',
        `Acquisition confirmed for ₹${totalAmount.toLocaleString('en-IN')}.\n\n₹${fairWageDirectAmount.toLocaleString('en-IN')} (85%+) has been settled directly into the master artisan guild accounts with zero middleman fee.`,
        [
          {
            text: 'View Lineage Receipt',
            onPress: () => {
              clearCart();
              onClose();
            },
          },
        ]
      );
    }, 1200);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Heritage Basket ({totalItems})</Text>
          {items.length > 0 ? (
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyTitle}>Your Heritage Basket is Empty</Text>
            <Text style={styles.emptyDesc}>
              Discover certified Indian handicrafts directly from master rural artisans.
            </Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={onClose}>
              <Text style={styles.exploreBtnText}>Explore Master Crafts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView style={styles.scrollArea} contentContainerStyle={{ padding: 16 }}>
              {/* Fair-Wage Guarantee Card */}
              <View style={styles.fairWageBanner}>
                <Text style={styles.fairWageIcon}>🕊️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fairWageTitle}>100% Direct Fair Wage Protocol</Text>
                  <Text style={styles.fairWageDesc}>
                    ₹{fairWageDirectAmount.toLocaleString('en-IN')} will be transferred directly to rural artisan cooperatives upon checkout.
                  </Text>
                </View>
              </View>

              {/* Line Items */}
              {items.map(({ product, quantity }) => (
                <View key={product.id} style={styles.itemRow}>
                  <Image source={{ uri: product.images[0] }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.itemArtisan}>By {product.artisanName}</Text>
                    <Text style={styles.itemPrice}>
                      ₹{(product.price * quantity).toLocaleString('en-IN')}
                    </Text>

                    {/* Quantity Selector */}
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeFromCart(product.id)}
                      >
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Bottom Checkout Section */}
            <View style={styles.footer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Direct Artisan Settlement (85%+)</Text>
                <Text style={[styles.summaryVal, { color: colors.success }]}>
                  ₹{fairWageDirectAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Provenance Blockchain Hallmarking</Text>
                <Text style={[styles.summaryVal, { color: colors.primary }]}>FREE</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
              </View>

              {/* Checkout with UPI / Razorpay Button */}
              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={handleCheckout}
                disabled={checkingOut}
                activeOpacity={0.88}
              >
                <Text style={styles.checkoutBtnText}>
                  {checkingOut ? 'Initiating UPI Settlement...' : `Instant UPI / Card Payment (₹${totalAmount.toLocaleString('en-IN')}) ⚡`}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    color: colors.charcoal,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  clearText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.charcoal,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  fairWageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  fairWageIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  fairWageTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  fairWageDesc: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    lineHeight: 16,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  itemArtisan: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  removeBtn: {
    marginLeft: 'auto',
  },
  removeText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.charcoal,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.charcoal,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

