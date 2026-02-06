import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { FreeEntryCard } from '../../src/components/FreeEntryCard';
import api from '../../src/config/api';

interface LoyaltyData {
  points: number;
  check_ins_count: number;
  progress_to_next_reward: number;
  points_needed: number;
  rewards_earned: number;
  recent_check_ins: Array<{
    event_name: string;
    points: number;
    date: string;
  }>;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/loyalty/my-points');
      setLoyaltyData(response.data);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    if (!loyaltyData || loyaltyData.points < 25) {
      Alert.alert('Pas encore', `Il te faut ${loyaltyData?.points_needed || 25} Invasion Coins de plus!`);
      return;
    }

    try {
      const response = await api.post('/loyalty/claim-reward');
      Alert.alert(
        'Récompense réclamée! 🎉',
        `Code: ${response.data.code}\n\nMontre ce code à l'entrée pour ton guest gratuit!`,
        [
          { text: 'OK', onPress: () => loadLoyaltyData() }
        ]
      );
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de la réclamation';
      Alert.alert('Erreur', message);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Veux-tu vraiment te déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Oui', 
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }, 
          style: 'destructive' 
        }
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadLoyaltyData}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={theme.colors.textPrimary} />
            </View>
            <View>
              <Text style={styles.name}>{user?.name || 'Utilisateur'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              {user?.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Free Entry Card */}
        <FreeEntryCard />

        {/* Loyalty Card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyHeader}>
            <Text style={styles.loyaltyTitle}>Invasion Rewards</Text>
            <TouchableOpacity onPress={() => setShowQR(!showQR)}>
              <Ionicons name="qr-code" size={28} color={theme.colors.neonPink} />
            </TouchableOpacity>
          </View>

          {/* QR Code */}
          {showQR && user && (
            <View style={styles.qrContainer}>
              <QRCode
                value={JSON.stringify({
                  type: 'loyalty_checkin',
                  user_id: user.id,
                  timestamp: new Date().toISOString(),
                  app: 'InvasionLatina'
                })}
                size={200}
                backgroundColor="white"
              />
              <Text style={styles.qrText}>Montre ce QR à l'entrée</Text>
            </View>
          )}

          {/* Points Display */}
          {loyaltyData && (
            <>
              <View style={styles.pointsDisplay}>
                <Text style={styles.pointsNumber}>{loyaltyData.points}</Text>
                <Text style={styles.pointsLabel}>Invasion Coins</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${loyaltyData.progress_to_next_reward}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {loyaltyData.points_needed} Invasion Coins pour un guest gratuit
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                  <Text style={styles.statNumber}>{loyaltyData.check_ins_count}</Text>
                  <Text style={styles.statLabel}>Visites</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="gift" size={24} color={theme.colors.neonPink} />
                  <Text style={styles.statNumber}>{loyaltyData.rewards_earned}</Text>
                  <Text style={styles.statLabel}>Récompenses</Text>
                </View>
              </View>

              {/* Claim Button */}
              <TouchableOpacity
                style={[
                  styles.claimButton,
                  loyaltyData.points < 25 && styles.claimButtonDisabled
                ]}
                onPress={handleClaimReward}
                disabled={loyaltyData.points < 25}
              >
                <Ionicons name="ticket" size={20} color="white" />
                <Text style={styles.claimButtonText}>
                  {loyaltyData.points >= 25 ? 'Réclamer Guest Gratuit (25 Coins)' : 'Pas encore assez de Coins'}
                </Text>
              </TouchableOpacity>

              {/* Recent Check-ins */}
              {loyaltyData.recent_check_ins.length > 0 && (
                <View style={styles.historySection}>
                  <Text style={styles.historyTitle}>Historique récent</Text>
                  {loyaltyData.recent_check_ins.map((checkin, index) => (
                    <View key={index} style={styles.historyItem}>
                      <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyEvent}>{checkin.event_name}</Text>
                        <Text style={styles.historyDate}>
                          {new Date(checkin.date).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                      <Text style={styles.historyPoints}>+{checkin.points} Coins</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Admin DJ Dashboard Button */}
        {user?.role === 'admin' && (
          <View style={styles.adminSection}>
            <Text style={styles.adminSectionTitle}>Administration</Text>
            
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/admin/content-manager')}
            >
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.adminButtonText}>Gestion du Contenu</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.djDashboardButton}
              onPress={() => router.push('/admin/dj-dashboard')}
            >
              <Ionicons name="headset" size={24} color="white" />
              <Text style={styles.djDashboardText}>DJ Dashboard</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookingsButton}
              onPress={() => router.push('/admin/bookings')}
            >
              <Ionicons name="restaurant" size={24} color="white" />
              <Text style={styles.bookingsButtonText}>Réservations Tables</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scannerButton}
              onPress={() => router.push('/admin/loyalty-scanner')}
            >
              <Ionicons name="qr-code" size={24} color="white" />
              <Text style={styles.scannerButtonText}>Scanner QR Fidélité</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.djSelectionButton}
              onPress={() => router.push('/admin/dj-selection')}
            >
              <Ionicons name="people" size={24} color="white" />
              <Text style={styles.djSelectionButtonText}>Sélection DJs Event</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Language Selector */}
        <View style={styles.languageSection}>
          <Text style={styles.languageSectionTitle}>Langue / Language / Taal</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'fr' && styles.languageButtonActive
              ]}
              onPress={() => setLanguage('fr')}
            >
              <Text style={styles.languageFlag}>🇫🇷</Text>
              <Text style={[
                styles.languageButtonText,
                language === 'fr' && styles.languageButtonTextActive
              ]}>
                Français
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'en' && styles.languageButtonActive
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text style={styles.languageFlag}>🇬🇧</Text>
              <Text style={[
                styles.languageButtonText,
                language === 'en' && styles.languageButtonTextActive
              ]}>
                English
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'es' && styles.languageButtonActive
              ]}
              onPress={() => setLanguage('es')}
            >
              <Text style={styles.languageFlag}>🇪🇸</Text>
              <Text style={[
                styles.languageButtonText,
                language === 'es' && styles.languageButtonTextActive
              ]}>
                Español
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'nl' && styles.languageButtonActive
              ]}
              onPress={() => setLanguage('nl')}
            >
              <Text style={styles.languageFlag}>🇳🇱</Text>
              <Text style={[
                styles.languageButtonText,
                language === 'nl' && styles.languageButtonTextActive
              ]}>
                Nederlands
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Comment ça marche?</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>• Montre ton QR code à l'entrée = +5 Invasion Coins</Text>
            <Text style={styles.infoText}>• 25 Invasion Coins = 1 guest gratuit</Text>
            <Text style={styles.infoText}>• 1 scan par événement maximum</Text>
            <Text style={styles.infoText}>• Récompense valable 90 jours</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },

  content: {
    paddingBottom: 40,
  },

  // Header
  header: {
    padding: theme.spacing.xl,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  name: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  adminBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },

  // Loyalty Card
  loyaltyCard: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  loyaltyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  qrContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  qrText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.black,
    fontWeight: theme.fontWeight.bold,
  },
  pointsDisplay: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  pointsNumber: {
    fontSize: 64,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  pointsLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  progressContainer: {
    marginVertical: theme.spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.elevated,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  claimButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
    opacity: 0.5,
  },
  claimButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  historySection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.elevated,
  },
  historyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  historyInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  historyEvent: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  historyDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  historyPoints: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.success,
  },

  // Bookings Button
  bookingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  bookingsButtonText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },

  // Language Section
  languageSection: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  languageSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  languageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  languageButton: {
    width: '48%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  languageFlag: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  languageButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  languageButtonTextActive: {
    color: theme.colors.primary,
  },

  // DJ Dashboard Button
  djDashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  djDashboardText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },

  // Admin Section
  adminSection: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  adminSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  adminButtonText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  scannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  scannerButtonText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  djSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BCD4',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  djSelectionButtonText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },

  // Info Section
  infoSection: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  infoTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  infoBox: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    gap: theme.spacing.sm,
  },
  logoutText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.error,
  },
});