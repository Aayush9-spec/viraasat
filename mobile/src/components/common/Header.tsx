import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useLocalization, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../context/LocalizationContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenArtisanStudio: () => void;
}

export function Header({ onOpenCart, onOpenArtisanStudio }: HeaderProps) {
  const { currentLanguage, setLanguage, t } = useLocalization();
  const { totalItems } = useCart();
  const { currentRole, switchRole } = useAuth();
  const [langModalVisible, setLangModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Brand & Subtitle */}
      <View style={styles.brandRow}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>

        {/* Action Controls */}
        <View style={styles.actions}>
          {/* Language Selector Pill */}
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.pillIcon}>🌐</Text>
            <Text style={styles.pillText}>{currentLanguage.native}</Text>
          </TouchableOpacity>

          {/* Role Switcher Pill */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              currentRole === 'artisan' && styles.artisanPill,
            ]}
            onPress={() => {
              if (currentRole === 'buyer') {
                switchRole('artisan');
                onOpenArtisanStudio();
              } else {
                switchRole('buyer');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.pillIcon}>
              {currentRole === 'artisan' ? '⚒️' : '👑'}
            </Text>
            <Text
              style={[
                styles.pillText,
                currentRole === 'artisan' && styles.artisanPillText,
              ]}
            >
              {currentRole === 'artisan' ? 'Artisan' : 'Patron'}
            </Text>
          </TouchableOpacity>

          {/* Cart Icon */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={onOpenCart}
            activeOpacity={0.7}
          >
            <Text style={styles.cartIcon}>🛍️</Text>
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Picker Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.langModalContent}>
            <Text style={styles.langModalTitle}>Select Language / भाषा चुनें</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langOption,
                    currentLanguage.code === lang.code && styles.selectedLangOption,
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setLangModalVisible(false);
                  }}
                >
                  <Text style={styles.langOptionNative}>{lang.native}</Text>
                  <Text style={styles.langOptionName}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    flexDirection: 'column',
  },
  logo: {
    width: 140,
    height: 42,
  },
  tagline: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232, 202, 130, 0.35)',
  },
  artisanPill: {
    backgroundColor: colors.gold,
    borderColor: colors.goldLight,
  },
  pillIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  artisanPillText: {
    color: colors.charcoal,
  },
  cartButton: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 202, 130, 0.35)',
  },
  cartIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.gold,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.charcoal,
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  langModalContent: {
    backgroundColor: colors.parchment,
    borderRadius: 20,
    width: '100%',
    padding: 20,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  langModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: colors.primary,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedLangOption: {
    backgroundColor: 'rgba(197, 155, 75, 0.15)',
    borderColor: colors.gold,
  },
  langOptionNative: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.charcoal,
  },
  langOptionName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

