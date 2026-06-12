import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import logger from '../config/logger';

interface FreeEntryVoucher {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  used_at?: string;
  event_id?: string;
}

interface FreeEntryCardProps {
  visible?: boolean;
}

export function FreeEntryCard({ visible = true }: FreeEntryCardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showQRModal, setShowQRModal] = useState(false);
  const [voucher, setVoucher] = useState<FreeEntryVoucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const loyaltyPoints = user?.loyalty_points || 0;
  const canClaimFreeEntry = loyaltyPoints >= 25;

  useEffect(() => {
    if (user?.id) {
      checkExistingVoucher();
    }
  }, [user?.id]);

  const checkExistingVoucher = async () => {
    try {
      setLoading(true);
      const response = await api.get('/loyalty/free-entry/check');
      if (response.data.voucher) {
        setVoucher(response.data.voucher);
      }
    } catch (error) {
      logger.log('No existing voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimFreeEntry = async () => {
    if (!canClaimFreeEntry) {
      Alert.alert(
        t('insufficientPoints'),
        t('insufficientPointsMessage').replace('{points}', String(loyaltyPoints))
      );
      return;
    }

    Alert.alert(
      t('getFreeEntry'),
      t('freeEntryConfirmMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: async () => {
            try {
              setClaiming(true);
              const response = await api.post('/loyalty/free-entry/claim');
              setVoucher(response.data.voucher);
              Alert.alert(
                `🎉 ${t('congratulations')}`,
                t('freeEntryCongrats')
              );
            } catch (error: any) {
              Alert.alert(t('error'), error.response?.data?.detail || t('freeEntryClaimError'));
            } finally {
              setClaiming(false);
            }
          }
        }
      ]
    );
  };

  if (!visible || loading) return null;

  // Already has an unused voucher
  if (voucher && !voucher.used) {
    return (
      <>
        <TouchableOpacity style={styles.freeEntryCard} onPress={() => setShowQRModal(true)}>
          <View style={styles.freeEntryIcon}>
            <Ionicons name="ticket" size={28} color="white" />
          </View>
          <View style={styles.freeEntryContent}>
            <Text style={styles.freeEntryTitle}>{t('freeEntryActive')}</Text>
<Text style={styles.freeEntrySubtitle}>{t('tapToShowQr')}</Text>
          </View>
          <Ionicons name="qr-code" size={28} color="white" />
        </TouchableOpacity>

        {/* QR Code Modal */}
        <Modal visible={showQRModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.qrModal}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowQRModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              <Text style={styles.qrTitle}>🎫 {t('freeEntry')}</Text>
<Text style={styles.qrSubtitle}>{t('showQrCodeAtEntrance')}</Text>

              <View style={styles.qrContainer}>
                <QRCode
                  value={JSON.stringify({
                    type: 'free_entry',
                    voucher_id: voucher.id,
                    user_id: user?.id,
                  })}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>

              <Text style={styles.qrCode}>Code: {voucher.id.slice(-8).toUpperCase()}</Text>
              
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color={theme.colors.warning} />
<Text style={styles.warningText}>{t('qrCodeOneTime')}</Text>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Can claim free entry
  if (canClaimFreeEntry) {
    return (
      <TouchableOpacity
        style={[styles.freeEntryCard, styles.freeEntryAvailable]}
        onPress={handleClaimFreeEntry}
        disabled={claiming}
      >
        <View style={styles.freeEntryIcon}>
          <Ionicons name="gift" size={28} color="white" />
        </View>
        <View style={styles.freeEntryContent}>
          <Text style={styles.freeEntryTitle}>{t('freeEntryAvailable')}</Text>
          <Text style={styles.freeEntrySubtitle}>
            {claiming ? t('loading') : t('claimFreeEntryHint')}
          </Text>
        </View>
        {claiming ? (
          <ActivityIndicator color="white" />
        ) : (
          <Ionicons name="chevron-forward" size={24} color="white" />
        )}
      </TouchableOpacity>
    );
  }

  // Not enough points - show progress
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Ionicons name="ticket-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.progressTitle}>{t('freeEntry')}</Text>
      </View>
      <Text style={styles.progressSubtitle}>
        {t('pointsRemainingForFreeEntry').replace('{points}', String(25 - loyaltyPoints))}
      </Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${(loyaltyPoints / 25) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{loyaltyPoints}/25 points</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  freeEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  freeEntryAvailable: {
    backgroundColor: theme.colors.primary,
  },
  freeEntryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeEntryContent: {
    flex: 1,
  },
  freeEntryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  freeEntrySubtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Progress Card
  progressCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.elevated,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  progressTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  progressSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  qrModal: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  qrTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  qrSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  qrCode: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 2,
    marginBottom: theme.spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
  },
});

export default FreeEntryCard;
