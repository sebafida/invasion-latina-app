import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import api from '../../src/config/api';
import { LoginRequiredModal } from '../../src/components/LoginRequiredModal';
import { registerForPushNotifications } from '../../src/config/notifications';
import { WhatsAppButton } from '../../src/components/WhatsAppButton';

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

interface FreeEntryVoucher {
  id: string;
  code: string;
  used: boolean;
}

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showFreeEntryQR, setShowFreeEntryQR] = useState(false);
  const [freeEntryVoucher, setFreeEntryVoucher] = useState<FreeEntryVoucher | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  
  // Scroll tracking for WhatsApp button
  const scrollY = useRef(new Animated.Value(0)).current;

  // Check if user needs to set their name (Apple Sign In users)
  const needsNameSetup = () => {
    if (!user) return false;
    const name = user.name || '';
    const email = user.email || '';
    
    // Check if it's an Apple Sign In user with placeholder name
    const isAppleUser = email.includes('privaterelay.appleid.com') || user.auth_provider === 'apple';
    const hasPlaceholderName = !name || 
      name.toLowerCase() === 'user' || 
      name.toLowerCase().startsWith('user') ||
      name === 'Nuevo Miembro' ||
      name === 'Amigo' ||
      /^[a-f0-9-]{20,}$/i.test(name);
    
    return isAppleUser && hasPlaceholderName;
  };

  // Save new name
  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom');
      return;
    }
    
    try {
      setSavingName(true);
      await api.put('/user/profile', { name: newName.trim() });
      
      // Update local user state
      if (user) {
        setUser({ ...user, name: newName.trim() });
      }
      
      setShowEditNameModal(false);
      setNewName('');
      Alert.alert('Succès', 'Votre nom a été mis à jour');
    } catch (error) {
      console.error('Error saving name:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le nom');
    } finally {
      setSavingName(false);
    }
  };

  // Get display name - handles Apple Sign In placeholder names
  const getDisplayName = () => {
    if (!user) {
      return t('profile');
    }
    
    const name = user.name || '';
    
    // Check if it's a default/placeholder name
    const isPlaceholder = !name || 
      name.toLowerCase() === 'user' || 
      name.toLowerCase().startsWith('user') ||
      name === 'Nuevo Miembro' ||
      name === 'Amigo' ||
      /^[a-f0-9-]{20,}$/i.test(name); // UUID-like strings
    
    if (isPlaceholder) {
      // Try to get name from email
      const email = user.email || '';
      if (email && !email.includes('privaterelay.appleid.com')) {
        const emailName = email.split('@')[0];
        // Remove numbers and special chars, capitalize
        const cleanName = emailName.replace(/[0-9._-]/g, ' ').trim();
        if (cleanName.length > 0) {
          const firstName = cleanName.split(' ')[0];
          return firstName.charAt(0).toUpperCase() + firstName.slice(1);
        }
      }
      return null; // Return null for Apple users without name
    }
    
    // Return first name only
    const firstName = name.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  useEffect(() => {
    if (user) {
      loadLoyaltyData();
      checkFreeEntryVoucher();
    }
  }, [user]);

  const loadLoyaltyData = async () => {
    if (!user) return;
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

  const checkFreeEntryVoucher = async () => {
    if (!user) return;
    try {
      const response = await api.get('/loyalty/free-entry/check');
      if (response.data.voucher && !response.data.voucher.used) {
        setFreeEntryVoucher(response.data.voucher);
      }
    } catch (error) {
      // No voucher exists
    }
  };

  const handleClaimFreeEntry = async () => {
    if (!loyaltyData || loyaltyData.points < 25) {
      Alert.alert(t('notEnoughCoins'), `${loyaltyData?.points_needed || 25} ${t('coinsForFreeGuest')}`);
      return;
    }

    try {
      const response = await api.post('/loyalty/claim-reward');
      setFreeEntryVoucher({
        id: response.data.id || response.data.code,
        code: response.data.code,
        used: false
      });
      loadLoyaltyData();
      setShowFreeEntryQR(true);
    } catch (error: any) {
      const message = error.response?.data?.detail || t('error');
      Alert.alert(t('error'), message);
    }
  };

  const handleChangeLanguage = async (langCode: string) => {
    setChangingLanguage(true);
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setLanguage(langCode);
    setChangingLanguage(false);
    setShowLanguageModal(false);
  };

  const getCurrentLanguage = () => {
    return LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('yes'), 
          onPress: async () => {
            await logout();
            router.replace('/');
          }, 
          style: 'destructive' 
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('deleteAccount') || 'Supprimer mon compte',
      t('deleteAccountConfirm') || 'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible et toutes vos données seront supprimées.',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete') || 'Supprimer', 
          onPress: () => confirmDeleteAccount(), 
          style: 'destructive' 
        }
      ]
    );
  };

  const confirmDeleteAccount = () => {
    // Second confirmation for safety
    Alert.alert(
      t('finalConfirmation') || 'Confirmation finale',
      t('deleteAccountFinal') || 'Tapez "SUPPRIMER" pour confirmer la suppression de votre compte.',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirmDelete') || 'Confirmer la suppression', 
          onPress: async () => {
            try {
              await api.delete('/user/account');
              Alert.alert(
                t('accountDeleted') || 'Compte supprimé',
                t('accountDeletedMessage') || 'Votre compte a été supprimé avec succès.',
                [{ text: 'OK', onPress: () => {
                  logout();
                  router.replace('/');
                }}]
              );
            } catch (error) {
              Alert.alert(t('error'), t('deleteAccountError') || 'Erreur lors de la suppression du compte. Veuillez réessayer.');
            }
          }, 
          style: 'destructive' 
        }
      ]
    );
  };

  // Guest view - show when user is not logged in
  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Guest Header */}
          <View style={styles.guestHeader}>
            <View style={styles.guestAvatar}>
              <Ionicons name="person-outline" size={50} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.guestTitle}>{t('profile')}</Text>
            <Text style={styles.guestSubtitle}>{t('loginRequiredMessage')}</Text>
          </View>

          {/* Benefits Card */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>{t('howItWorks')}</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>{t('benefitRequestSongs')}</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>{t('benefitBookTables')}</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>{t('benefitEarnCoins')}</Text>
            </View>
          </View>

          {/* Login / Register buttons */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/register')}
          >
            <Ionicons name="person-add" size={20} color="white" />
            <Text style={styles.loginButtonText}>{t('createFreeAccount')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.secondaryButtonText}>{t('alreadyHaveAccountLogin')}</Text>
          </TouchableOpacity>

          {/* Language Selector */}
          <TouchableOpacity 
            style={styles.languageSelectorButton}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.languageSelectorLeft}>
              <Ionicons name="language" size={24} color={theme.colors.primary} />
              <View style={styles.languageSelectorInfo}>
                <Text style={styles.languageSelectorLabel}>{t('language')}</Text>
                <Text style={styles.languageSelectorValue}>
                  {getCurrentLanguage().flag} {getCurrentLanguage().name}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Language Modal */}
        <Modal
          visible={showLanguageModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View style={styles.languageModalOverlay}>
            <View style={styles.languageModalContent}>
              <View style={styles.languageModalHeader}>
                <Text style={styles.languageModalTitle}>{t('chooseLanguage')}</Text>
                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {changingLanguage ? (
                <View style={styles.languageLoadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.languageLoadingText}>{t('changingLanguage')}</Text>
                </View>
              ) : (
                <View style={styles.languageOptions}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageOption,
                        language === lang.code && styles.languageOptionActive
                      ]}
                      onPress={() => handleChangeLanguage(lang.code)}
                    >
                      <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                      <Text style={[
                        styles.languageOptionText,
                        language === lang.code && styles.languageOptionTextActive
                      ]}>
                        {lang.name}
                      </Text>
                      {language === lang.code && (
                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // Logged-in user view
  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadLoyaltyData}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileInfo}>
              {getDisplayName() ? (
                <>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color={theme.colors.textPrimary} />
                  </View>
                  <View>
                  <Text style={styles.name}>{getDisplayName()}</Text>
                  {user?.email && !user.email.includes('privaterelay.appleid.com') && !user.email.includes('@appleid.com') && (
                    <Text style={styles.email}>{user.email}</Text>
                  )}
                  {user?.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.editNameButton}
                onPress={() => setShowEditNameModal(true)}
              >
                <Ionicons name="person-add" size={24} color={theme.colors.primary} />
                <Text style={styles.editNameButtonText}>Ajouter votre prénom</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Edit Name Modal */}
        <Modal
          visible={showEditNameModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditNameModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editNameModalContent}>
              <View style={styles.editNameModalHeader}>
                <Text style={styles.editNameModalTitle}>Votre prénom</Text>
                <TouchableOpacity onPress={() => setShowEditNameModal(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.editNameInput}
                placeholder="Entrez votre prénom"
                placeholderTextColor={theme.colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <TouchableOpacity 
                style={[styles.saveNameButton, savingName && { opacity: 0.5 }]}
                onPress={handleSaveName}
                disabled={savingName}
              >
                {savingName ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveNameButtonText}>Sauvegarder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/my-bookings')}
            data-testid="my-bookings-button"
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Mes Réservations</Text>
              <Text style={styles.quickActionSubtitle}>Voir vos tables réservées</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Loyalty Card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyHeader}>
            <Text style={styles.loyaltyTitle}>{t('loyaltyTitle')}</Text>
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
              <Text style={styles.qrText}>{t('showQrAtEntry')}</Text>
            </View>
          )}

          {/* Points Display */}
          {loyaltyData && (
            <>
              <View style={styles.pointsDisplay}>
                <Text style={styles.pointsNumber}>{loyaltyData.points}</Text>
                <Text style={styles.pointsLabel}>{t('points')}</Text>
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
                  {loyaltyData.points_needed} {t('coinsForFreeGuest')}
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                  <Text style={styles.statNumber}>{loyaltyData.check_ins_count}</Text>
                  <Text style={styles.statLabel}>{t('visits')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="gift" size={24} color={theme.colors.neonPink} />
                  <Text style={styles.statNumber}>{loyaltyData.rewards_earned}</Text>
                  <Text style={styles.statLabel}>{t('rewards')}</Text>
                </View>
              </View>

              {/* Claim Button or Show QR */}
              {freeEntryVoucher ? (
                <TouchableOpacity
                  style={[styles.claimButton, styles.claimButtonActive]}
                  onPress={() => setShowFreeEntryQR(true)}
                >
                  <Ionicons name="qr-code" size={20} color="white" />
                  <Text style={styles.claimButtonText}>🎫 {t('viewQrCode')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.claimButton,
                    loyaltyData.points < 25 && styles.claimButtonDisabled
                  ]}
                  onPress={handleClaimFreeEntry}
                  disabled={loyaltyData.points < 25}
                >
                  <Ionicons name="ticket" size={20} color="white" />
                  <Text style={styles.claimButtonText}>
                    {loyaltyData.points >= 25 ? t('claimReward') : t('notEnoughCoins')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Recent Check-ins */}
              {loyaltyData.recent_check_ins.length > 0 && (
                <View style={styles.historySection}>
                  <Text style={styles.historyTitle}>{t('seeAll')}</Text>
                  {loyaltyData.recent_check_ins.map((checkin, index) => (
                    <View key={index} style={styles.historyItem}>
                      <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyEvent}>{checkin.event_name}</Text>
                        <Text style={styles.historyDate}>
                          {new Date(checkin.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : language === 'nl' ? 'nl-NL' : 'fr-FR')}
                        </Text>
                      </View>
                      <Text style={styles.historyPoints}>+{checkin.points} {t('coins')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Scan QR Code Button */}
        <TouchableOpacity
          style={styles.scanQRButton}
          onPress={() => router.push('/scan-qr')}
        >
          <View style={styles.scanQRIcon}>
            <Ionicons name="scan" size={28} color="white" />
          </View>
          <View style={styles.scanQRInfo}>
            <Text style={styles.scanQRTitle}>Scanner le QR Code</Text>
            <Text style={styles.scanQRSubtitle}>Gagne des Invasion Coins à chaque soirée !</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Admin DJ Dashboard Button */}
        {user?.role === 'admin' && (
          <View style={styles.adminSection}>
            <Text style={styles.adminSectionTitle}>{t('adminSection')}</Text>
            
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/admin/content-manager')}
            >
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.adminButtonText}>{t('manageContent')}</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.djDashboardButton}
              onPress={() => router.push('/admin/dj-dashboard')}
            >
              <Ionicons name="headset" size={24} color="white" />
              <Text style={styles.djDashboardText}>{t('djDashboard')}</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookingsButton}
              onPress={() => router.push('/admin/bookings')}
            >
              <Ionicons name="restaurant" size={24} color="white" />
              <Text style={styles.bookingsButtonText}>{t('bookingsManagement')}</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scannerButton}
              onPress={() => router.push('/admin/qr-manager')}
            >
              <Ionicons name="qr-code" size={24} color="white" />
              <Text style={styles.scannerButtonText}>Gestion QR Codes</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.usersButton}
              onPress={() => router.push('/admin/users')}
            >
              <Ionicons name="people-circle" size={24} color="white" />
              <Text style={styles.usersButtonText}>Utilisateurs & Stats</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.djSelectionButton}
              onPress={() => router.push('/admin/dj-selection')}
            >
              <Ionicons name="people" size={24} color="white" />
              <Text style={styles.djSelectionButtonText}>{t('djSelection')}</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.eventSettingsButton}
              onPress={() => router.push('/admin/event-settings')}
            >
              <Ionicons name="settings" size={24} color="white" />
              <Text style={styles.eventSettingsButtonText}>{t('eventSettings')}</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adminButton, { backgroundColor: '#9b59b6' }]}
              onPress={() => router.push('/admin/notifications')}
            >
              <Ionicons name="notifications" size={24} color="white" />
              <Text style={styles.adminButtonText}>Notifications Push</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Language Selector Button */}
        <TouchableOpacity 
          style={styles.languageSelectorButton}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={styles.languageSelectorLeft}>
            <Ionicons name="language" size={24} color={theme.colors.primary} />
            <View style={styles.languageSelectorInfo}>
              <Text style={styles.languageSelectorLabel}>{t('language')}</Text>
              <Text style={styles.languageSelectorValue}>
                {getCurrentLanguage().flag} {getCurrentLanguage().name}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Notification Preferences Button */}
        <TouchableOpacity 
          style={styles.notificationPrefButton}
          onPress={() => router.push('/settings/notification-preferences')}
        >
          <View style={styles.languageSelectorLeft}>
            <Ionicons name="notifications" size={24} color={theme.colors.secondary} />
            <View style={styles.languageSelectorInfo}>
              <Text style={styles.languageSelectorLabel}>{t('notificationPreferences')}</Text>
              <Text style={styles.languageSelectorValue}>
                {t('chooseWhatToReceive')}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Language Modal */}
        <Modal
          visible={showLanguageModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View style={styles.languageModalOverlay}>
            <View style={styles.languageModalContent}>
              <View style={styles.languageModalHeader}>
                <Text style={styles.languageModalTitle}>{t('chooseLanguage')}</Text>
                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {changingLanguage ? (
                <View style={styles.languageLoadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.languageLoadingText}>{t('changingLanguage')}</Text>
                </View>
              ) : (
                <View style={styles.languageOptions}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageOption,
                        language === lang.code && styles.languageOptionActive
                      ]}
                      onPress={() => handleChangeLanguage(lang.code)}
                    >
                      <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                      <Text style={[
                        styles.languageOptionText,
                        language === lang.code && styles.languageOptionTextActive
                      ]}>
                        {lang.name}
                      </Text>
                      {language === lang.code && (
                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('howItWorks')}</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>• {t('loyaltyInfo1')}</Text>
            <Text style={styles.infoText}>• {t('loyaltyInfo2')}</Text>
            <Text style={styles.infoText}>• {t('loyaltyInfo3')}</Text>
            <Text style={styles.infoText}>• {t('loyaltyInfo4')}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.textMuted} />
          <Text style={styles.deleteAccountText}>{t('deleteAccount') || 'Supprimer mon compte'}</Text>
        </TouchableOpacity>
      </View>

      {/* Free Entry QR Code Modal */}
      <Modal visible={showFreeEntryQR} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowFreeEntryQR(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.qrModalTitle}>🎫 {t('freeGuestEntry')}</Text>
            <Text style={styles.qrModalSubtitle}>
              {t('showQrAtEntry')}
            </Text>

            {freeEntryVoucher && (
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={JSON.stringify({
                    type: 'free_entry',
                    voucher_id: freeEntryVoucher.id,
                    code: freeEntryVoucher.code,
                    user_id: user?.id,
                  })}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>
            )}

            <Text style={styles.qrCodeText}>
              Code: {freeEntryVoucher?.code?.toUpperCase()}
            </Text>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={theme.colors.warning} />
              <Text style={styles.warningText}>
                {t('qrCodeOneTime')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Login Required Modal */}
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </Animated.ScrollView>
    
    {/* WhatsApp Floating Button */}
    <WhatsAppButton scrollY={scrollY} />
    </View>
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

  // Guest styles
  guestHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  guestAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  guestTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  guestSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsCard: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  benefitsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  benefitText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  loginButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  secondaryButton: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
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
  freeEntryScannerButton: {
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
  freeEntryScannerButtonText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  eventSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#607D8B',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  eventSettingsButtonText: {
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

  // Delete Account Button
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  deleteAccountText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },

  // QR Modal Styles
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
  closeModalButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.xs,
    zIndex: 10,
  },
  qrModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  qrModalSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  qrCodeText: {
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
  claimButtonActive: {
    backgroundColor: theme.colors.success,
  },

  // Language Selector Button
  languageSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  notificationPrefButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.spacing.xl,
    marginTop: 0,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  languageSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  languageSelectorInfo: {
    flexDirection: 'column',
  },
  languageSelectorLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  languageSelectorValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },

  // Language Modal
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  languageModalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.xl,
  },
  languageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevated,
  },
  languageModalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  languageLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  languageLoadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  languageOptions: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.elevated,
  },
  languageOptionActive: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  languageOptionFlag: {
    fontSize: 28,
    marginRight: theme.spacing.md,
  },
  languageOptionText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  languageOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  
  // Edit Name Button and Modal styles
  editNameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  editNameButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  editNameModalContent: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  editNameModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  editNameModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  editNameInput: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  saveNameButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  saveNameButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  
  // Scan QR Button styles
  scanQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.elevated,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  scanQRIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  scanQRInfo: {
    flex: 1,
  },
  scanQRTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  scanQRSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  
  // Referral Button styles
  referralButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.elevated,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E91E63' + '40',
  },
  referralIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  referralInfo: {
    flex: 1,
  },
  referralTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  referralSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  
  // Users Button styles
  usersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  usersButtonText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
});
