import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { FALLBACK_REVIEWS } from '../../api/client';
import { Review } from '../../types';

interface ArtisanStudioModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ArtisanStudioModal({ visible, onClose }: ArtisanStudioModalProps) {
  const { user, switchRole } = useAuth();
  const [artisanReviews, setArtisanReviews] = useState<Review[]>(
    Object.values(FALLBACK_REVIEWS).flat().filter((r) => r.artisanId === 'art-1')
  );
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const handleSendReply = (reviewId: string) => {
    if (!replyText.trim()) return;

    setArtisanReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              artisanResponse: {
                text: replyText.trim(),
                respondedAt: new Date().toISOString().split('T')[0],
              },
            }
          : r
      )
    );

    Alert.alert('Response Published!', 'Your direct guild message has been linked to the patron review.');
    setReplyText('');
    setActiveReplyId(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Master Artisan Studio & Guild</Text>
          <TouchableOpacity
            onPress={() => {
              switchRole('buyer');
              onClose();
            }}
          >
            <Text style={styles.switchText}>Patron View</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={{ padding: 16 }}>
          {/* Artisan Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>MA</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.artisanName}>{user?.name || 'Master Ansari'}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Master Weaver</Text>
                </View>
              </View>
              <Text style={styles.guildName}>Kashi Bunkar Sahkari Samiti</Text>
              <Text style={styles.village}>Mubarakpur, Varanasi (UP) • GI-IN-0023-UP</Text>
            </View>
          </View>

          {/* Earnings & Fair-Trade Metrics */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Direct Earnings</Text>
              <Text style={styles.statVal}>₹1,42,800</Text>
              <Text style={styles.statSub}>100% Fair Wage</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Active Orders</Text>
              <Text style={styles.statVal}>4</Text>
              <Text style={styles.statSub}>To Be Dispatched</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Guild Rating</Text>
              <Text style={styles.statVal}>4.9★</Text>
              <Text style={styles.statSub}>38 Reviews</Text>
            </View>
          </View>

          {/* Customer Reviews & Feedback Inbox */}
          <Text style={styles.sectionHeader}>Patron Feedback & Review Inbox</Text>
          <Text style={styles.sectionSub}>
            Respond directly to customer reviews to build lasting lineage trust.
          </Text>

          {artisanReviews.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.customerName}>{rev.customerName}</Text>
                <Text style={styles.stars}>{'★'.repeat(rev.rating)}</Text>
              </View>
              {rev.title && <Text style={styles.revTitle}>{rev.title}</Text>}
              <Text style={styles.revComment}>{rev.comment}</Text>

              {rev.artisanResponse ? (
                <View style={styles.existingReply}>
                  <Text style={styles.replyHeader}>Your Response ({rev.artisanResponse.respondedAt}):</Text>
                  <Text style={styles.replyText}>{rev.artisanResponse.text}</Text>
                </View>
              ) : activeReplyId === rev.id ? (
                <View style={styles.replyForm}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Write a message of gratitude or craft explanation from your guild..."
                    placeholderTextColor={colors.textMuted}
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                  />
                  <View style={styles.replyActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setActiveReplyId(null)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sendBtn}
                      onPress={() => handleSendReply(rev.id)}
                    >
                      <Text style={styles.sendText}>Send Response</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.replyTriggerBtn}
                  onPress={() => {
                    setActiveReplyId(rev.id);
                    setReplyText('');
                  }}
                >
                  <Text style={styles.replyTriggerText}>💬 Reply to Patron</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
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
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  switchText: {
    fontSize: 12,
    color: colors.goldMuted,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.charcoal,
    fontSize: 18,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  artisanName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.charcoal,
    fontSize: 10,
    fontWeight: '800',
  },
  guildName: {
    fontSize: 12,
    color: colors.goldLight,
    marginTop: 2,
  },
  village: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: 4,
  },
  statSub: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 12,
    marginTop: 2,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
  },
  stars: {
    color: '#D97706',
    fontSize: 12,
  },
  revTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 4,
  },
  revComment: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  replyTriggerBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.parchment,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  replyTriggerText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  existingReply: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(197, 155, 75, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  replyHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldMuted,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: colors.charcoal,
    fontStyle: 'italic',
  },
  replyForm: {
    marginTop: 10,
  },
  replyInput: {
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: colors.charcoal,
    minHeight: 60,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

