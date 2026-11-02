import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Review, Product } from '../../types';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { ViraasatApiClient } from '../../api/client';

interface ReviewFormModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onReviewSubmitted: (newReview: Review) => void;
}

export function ReviewFormModal({
  visible,
  product,
  onClose,
  onReviewSubmitted,
}: ReviewFormModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Required', 'Please share your experience with this handcrafted creation.');
      return;
    }

    setSubmitting(true);
    try {
      const submitted = await ViraasatApiClient.submitReview({
        productId: product.id,
        artisanId: product.artisanId,
        customerName: user ? user.name : 'Heritage Connoisseur',
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        verifiedPurchase: true,
      });

      onReviewSubmitted(submitted);
      Alert.alert('Dhanyawad!', 'Your review has been submitted and shared directly with the artisan guild.');
      setTitle('');
      setComment('');
      setRating(5);
      onClose();
    } catch {
      Alert.alert('Error', 'Could not record your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Review Craft Creation</Text>
              <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Star Rating Picker */}
          <View style={styles.starPickerRow}>
            <Text style={styles.pickerLabel}>Your Rating:</Text>
            <View style={styles.starsWrapper}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starBtn}
                >
                  <Text style={[styles.starIcon, star <= rating && styles.activeStar]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <Text style={styles.fieldLabel}>Review Headline</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Masterful weave, true Varanasi heritage"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Comment */}
          <Text style={styles.fieldLabel}>Your Detailed Review *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the texture, craftsmanship, colors, and direct artisan experience..."
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Guild Fair-Trade Reminder */}
          <View style={styles.fairTradeCallout}>
            <Text style={styles.calloutIcon}>🕊️</Text>
            <Text style={styles.calloutText}>
              Your feedback directly reaches <Text style={{ fontWeight: '700' }}>{product.artisanName}</Text> and their village cooperative.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: colors.gold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  productName: {
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 260,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    color: colors.charcoal,
    fontWeight: '700',
  },
  starPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
  },
  starsWrapper: {
    flexDirection: 'row',
    gap: 4,
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 26,
    color: '#D1D5DB',
  },
  activeStar: {
    color: '#D97706',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 12,
  },
  textArea: {
    height: 90,
  },
  fairTradeCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 155, 75, 0.12)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    marginBottom: 16,
  },
  calloutIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  calloutText: {
    fontSize: 11,
    color: colors.charcoal,
    flex: 1,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

