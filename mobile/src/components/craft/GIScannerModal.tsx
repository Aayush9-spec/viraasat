import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { ViraasatApiClient } from '../../api/client';
import { GIScanResult } from '../../types';

interface GIScannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GIScannerModal({ visible, onClose }: GIScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<GIScanResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<'banarasi' | 'dhokra' | 'pottery'>('banarasi');

  const handleScan = async (preset: 'banarasi' | 'dhokra' | 'pottery') => {
    setSelectedPreset(preset);
    setScanning(true);
    setResult(null);

    const code = preset === 'banarasi' ? 'GI-IN-0023-UP' : preset === 'dhokra' ? 'GI-IN-0082-CG' : 'GI-IN-0045-RJ';
    const res = await ViraasatApiClient.verifyGIHallmark(code);
    setScanning(false);
    setResult(res);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>AI Camera GI Hallmark Scanner</Text>
              <Text style={styles.subtitle}>Scan craft seal or physical weave to verify provenance</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Viewfinder Frame */}
          <View style={styles.viewfinder}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            {scanning ? (
              <View style={styles.scanningBox}>
                <ActivityIndicator size="large" color={colors.goldLight} />
                <Text style={styles.scanningText}>Matching against GI Registry & PoW Nodes...</Text>
                <View style={styles.laserLine} />
              </View>
            ) : result ? (
              <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.verifiedHeader}>
                  <Text style={styles.verifiedIcon}>🛡️</Text>
                  <Text style={styles.verifiedTitle}>Authentic GI Hallmark Verified</Text>
                  <Text style={styles.confidenceScore}>
                    Confidence: {result.hallmarkConfidence}% (Cryptographically Anchored)
                  </Text>
                </View>

                <View style={styles.resultDetails}>
                  <Text style={styles.resLabel}>CRAFT TITLE</Text>
                  <Text style={styles.resVal}>{result.productName}</Text>

                  <Text style={styles.resLabel}>MASTER ARTISAN</Text>
                  <Text style={styles.resVal}>{result.artisanName}</Text>

                  <Text style={styles.resLabel}>GI REGISTRY NO.</Text>
                  <Text style={styles.resVal}>{result.giRegistryNumber}</Text>

                  <Text style={styles.resLabel}>HISTORIC LINEAGE ERA</Text>
                  <Text style={styles.resVal}>{result.craftLineageEra}</Text>

                  <Text style={styles.resLabel}>GENESIS BLOCK HASH</Text>
                  <Text style={styles.hashVal}>{result.blockHash}</Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.idleViewfinder}>
                <Text style={styles.viewfinderIcon}>📷</Text>
                <Text style={styles.viewfinderPrompt}>
                  Align the physical craft seal, handloom hallmark, or QR code within this arch
                </Text>
              </View>
            )}
          </View>

          {/* Preset Buttons for Quick Demo Testing */}
          <Text style={styles.presetHeading}>Select Sample Craft Tag to Scan:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[styles.presetBtn, selectedPreset === 'banarasi' && styles.presetActive]}
              onPress={() => handleScan('banarasi')}
            >
              <Text style={styles.presetText}>Banarasi Silk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetBtn, selectedPreset === 'dhokra' && styles.presetActive]}
              onPress={() => handleScan('dhokra')}
            >
              <Text style={styles.presetText}>Bastar Bronze</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetBtn, selectedPreset === 'pottery' && styles.presetActive]}
              onPress={() => handleScan('pottery')}
            >
              <Text style={styles.presetText}>Blue Pottery</Text>
            </TouchableOpacity>
          </View>

          {/* Action Trigger */}
          <TouchableOpacity
            style={styles.scanActionBtn}
            onPress={() => handleScan(selectedPreset)}
            disabled={scanning}
            activeOpacity={0.85}
          >
            <Text style={styles.scanActionText}>
              {scanning ? 'Verifying Cryptographic Ledger...' : 'Scan & Verify Lineage ⚡'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    backgroundColor: colors.charcoal,
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.gold,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.goldLight,
  },
  subtitle: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 2,
    maxWidth: 260,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  viewfinder: {
    width: '100%',
    height: 240,
    backgroundColor: '#17120F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.4)',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.gold,
  },
  cornerTR: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.gold,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.gold,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.gold,
  },
  scanningBox: {
    alignItems: 'center',
  },
  scanningText: {
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  laserLine: {
    width: 180,
    height: 2,
    backgroundColor: '#EF4444',
    marginTop: 16,
  },
  idleViewfinder: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  viewfinderIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  viewfinderPrompt: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  resultScroll: {
    width: '100%',
    padding: 14,
  },
  verifiedHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  verifiedIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  verifiedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.goldLight,
  },
  confidenceScore: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '700',
    marginTop: 2,
  },
  resultDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
  },
  resLabel: {
    fontSize: 9,
    color: colors.gold,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  resVal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 1,
  },
  hashVal: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: colors.primary,
    marginTop: 1,
  },
  presetHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1D5DB',
    marginTop: 14,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  presetActive: {
    backgroundColor: 'rgba(197, 155, 75, 0.25)',
    borderColor: colors.gold,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  scanActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});

