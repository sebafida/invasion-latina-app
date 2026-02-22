import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import api from '../../src/config/api';
import { LoginRequiredModal } from '../../src/components/LoginRequiredModal';
import logger from '../../src/config/logger';

interface SongRequest {
  id: string;
  song_title: string;
  artist_name: string;
  user_name: string;
  votes: number;
  times_requested: number;
  requested_at: string;
  can_vote: boolean;
  can_request: boolean;
  status?: string;
  rejection_reason?: string;
  rejection_label?: string;
}

export default function DJRequestsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  // 2.6 - Mode dev uniquement pour admins ou en développement
  const [devMode, setDevMode] = useState(user?.role === 'admin' || __DEV__);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 2.1 - Fix memory leak : utiliser useFocusEffect au lieu de useEffect
  useFocusEffect(
    useCallback(() => {
      loadRequests();
      
      // Auto-refresh every 5 seconds uniquement quand l'écran est visible
      const interval = setInterval(() => {
        loadRequests();
      }, 5000);
      
      return () => clearInterval(interval);
    }, [])
  );

  const loadRequests = async () => {
    try {
      const response = await api.get('/dj/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleRequestSong = async () => {
    if (!songTitle.trim() || !artistName.trim()) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    try {
      setLoading(true);
      
      // Get real location
      let latitude = null;
      let longitude = null;
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          latitude = location.coords.latitude.toString();
          longitude = location.coords.longitude.toString();
        } catch (locError) {
          console.log('Could not get location:', locError);
        }
      }

      const requestData = {
        song_title: songTitle.trim(),
        artist_name: artistName.trim(),
        latitude,
        longitude,
      };

      const response = await api.post('/dj/request-song', requestData);
      
      // Clear form FIRST before showing alert
      setSongTitle('');
      setArtistName('');
      
      loadRequests();
      Alert.alert(t('success'), t('songRequested'));
    } catch (error: any) {
      const message = error.response?.data?.detail || t('error');
      Alert.alert(t('error'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    // Check token directly from AsyncStorage
    const token = await AsyncStorage.getItem('auth_token');
    if (token && user) {
      handleRequestSong();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleVote = async (requestId: string) => {
    try {
      // 4.2 - Haptic feedback sur les votes
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      await api.post(`/dj/vote/${requestId}`);
      Alert.alert(t('success'), t('voteRegistered'));
      loadRequests();
    } catch (error: any) {
      const message = error.response?.data?.detail || t('error');
      Alert.alert(t('error'), message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadRequests}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('requests')}</Text>
          </View>
        </View>

        {/* Dev Mode (Admin only) */}
        {user?.role === 'admin' && (
          <View style={styles.devModeCard}>
            <View style={styles.devModeHeader}>
              <Ionicons name="code" size={20} color={theme.colors.neonPink} />
              <Text style={styles.devModeTitle}>{t('modeTest')}</Text>
            </View>
            <View style={styles.devModeToggle}>
              <Text style={styles.devModeText}>
                {t('bypassGeofencing')}
              </Text>
              <Switch
                value={devMode}
                onValueChange={setDevMode}
                trackColor={{ false: '#444', true: theme.colors.primary }}
                thumbColor={devMode ? theme.colors.neonPink : '#f4f3f4'}
              />
            </View>
            {/* Status only for admin */}
            <View style={styles.statusCardInline}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.statusTextSmall}>
                {devMode ? t('testModeActive') : t('readyToRequest')}
              </Text>
            </View>
          </View>
        )}

        {/* Request Form */}
        <View style={styles.requestForm}>
          <Text style={styles.formTitle}>{t('requestSong')}</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputFull}
              placeholder={t('songTitle')}
              placeholderTextColor={theme.colors.textMuted}
              value={songTitle}
              onChangeText={setSongTitle}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputFull}
              placeholder={t('artist')}
              placeholderTextColor={theme.colors.textMuted}
              value={artistName}
              onChangeText={setArtistName}
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitRequest}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? t('loading') : t('sendRequest')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Requests List */}
        <View style={styles.requestsList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{t('requests')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          </View>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={64} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>{t('noRequests')}</Text>
              <Text style={styles.emptySubtext}>{t('requestSong')}!</Text>
            </View>
          ) : (
            requests.map((request, index) => (
              <View key={request.id} style={[
                styles.requestCard,
                request.status === 'rejected' && styles.requestCardRejected,
                request.status === 'played' && styles.requestCardPlayed
              ]}>
                <View style={styles.requestRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                
                <View style={styles.requestInfo}>
                  <Text style={styles.requestSong}>{request.song_title}</Text>
                  <Text style={styles.requestArtist}>{request.artist_name}</Text>
                  <View style={styles.requestMetadata}>
                    <Text style={styles.requestUser}>{t('requestedBy')} {request.user_name}</Text>
                    {request.times_requested > 1 && (
                      <>
                        <Text style={styles.metadataSeparator}>•</Text>
                        <Text style={styles.requestTimesRequested}>
                          {request.times_requested}x {t('requestedTimes')}
                        </Text>
                      </>
                    )}
                  </View>
                  
                  {/* Status badges */}
                  {request.status === 'played' && (
                    <View style={styles.statusBadgePlayed}>
                      <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                      <Text style={styles.statusTextPlayed}>{t('played') || 'Joué'}</Text>
                    </View>
                  )}
                  
                  {request.status === 'rejected' && (
                    <View style={styles.statusBadgeRejected}>
                      <Ionicons name="close-circle" size={14} color={theme.colors.error} />
                      <Text style={styles.statusTextRejected}>
                        {request.rejection_label || t('rejected') || 'Refusé'}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    !request.can_vote && styles.voteButtonDisabled,
                    request.status === 'rejected' && styles.voteButtonRejected,
                    request.status === 'played' && styles.voteButtonPlayed
                  ]}
                  onPress={() => handleVote(request.id)}
                  disabled={!request.can_vote || request.status === 'rejected' || request.status === 'played'}
                >
                  <Ionicons
                    name={request.status === 'played' ? 'checkmark' : request.status === 'rejected' ? 'close' : request.can_vote ? 'arrow-up' : 'checkmark'}
                    size={20}
                    color="white"
                  />
                  <Text style={styles.voteCount}>{request.votes}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Login Required Modal */}
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        feature={t('requestSong')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  
  content: {
    flex: 1,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  // Dev Mode
  devModeCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neonPink + '40',
  },
  devModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  devModeTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neonPink,
    marginLeft: theme.spacing.sm,
  },
  devModeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devModeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusCardInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.elevated,
  },
  statusTextSmall: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
  },

  // Form
  requestForm: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  formTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  inputFull: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  submitButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },

  // List
  requestsList: {
    paddingHorizontal: theme.spacing.xl,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  listTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },

  // Request Card
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  requestRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rankNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  requestInfo: {
    flex: 1,
  },
  requestSong: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  requestArtist: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  requestMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestUser: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  metadataSeparator: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginHorizontal: theme.spacing.xs,
  },
  requestTimesRequested: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neonPink,
  },
  voteButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    minWidth: 60,
  },
  voteButtonDisabled: {
    backgroundColor: theme.colors.success,
  },
  voteCount: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
    marginTop: 2,
  },
  
  // Clear All Section
  clearAllSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  clearAllButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  
  // Request Actions
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.error + '20',
  },
  
  // Status styles
  requestCardRejected: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: theme.colors.error + '50',
  },
  requestCardPlayed: {
    borderWidth: 1,
    borderColor: theme.colors.success + '50',
  },
  statusBadgeRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
    gap: 4,
  },
  statusTextRejected: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.medium,
  },
  statusBadgePlayed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
    gap: 4,
  },
  statusTextPlayed: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.medium,
  },
  voteButtonRejected: {
    backgroundColor: theme.colors.error,
    opacity: 0.5,
  },
  voteButtonPlayed: {
    backgroundColor: theme.colors.success,
  },
});
