import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';
import { useLanguage } from '../../src/context/LanguageContext';

interface NotificationPreferences {
  events: boolean;
  promotions: boolean;
  song_requests: boolean;
  friends: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  events: true,
  promotions: true,
  song_requests: true,
  friends: true,
};

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  const loadPreferences = useCallback(async () => {
    try {
      // Try to load from API first
      const response = await api.get('/user/notification-preferences');
      setPreferences(response.data);
    } catch (error) {
      // If API fails, load from local storage
      try {
        const stored = await AsyncStorage.getItem('notification_preferences');
        if (stored) {
          setPreferences(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Using default preferences');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    setSaving(true);
    try {
      // Save to API
      await api.put('/user/notification-preferences', newPreferences);
      // Also save locally as backup
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      // If API fails, just save locally
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    savePreferences(newPreferences);
  };

  const openSystemSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const enableAll = () => {
    const allEnabled: NotificationPreferences = {
      events: true,
      promotions: true,
      song_requests: true,
      friends: true,
    };
    savePreferences(allEnabled);
    Alert.alert('✅', t('allNotificationsEnabled'));
  };

  const disableAll = () => {
    Alert.alert(
      t('disableAllNotifications'),
      t('disableAllNotificationsConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('disable'),
          style: 'destructive',
          onPress: () => {
            const allDisabled: NotificationPreferences = {
              events: false,
              promotions: false,
              song_requests: false,
              friends: false,
            };
            savePreferences(allDisabled);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>🔔 {t('notificationPreferences')}</Text>
          <Text style={styles.subtitle}>{t('chooseWhatToReceive')}</Text>
        </View>
        {saving && <ActivityIndicator size="small" color={theme.colors.primary} />}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* System Settings Banner */}
        <TouchableOpacity style={styles.systemBanner} onPress={openSystemSettings}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.neonBlue} />
          <View style={styles.systemBannerText}>
            <Text style={styles.systemBannerTitle}>{t('systemNotificationSettings')}</Text>
            <Text style={styles.systemBannerSubtitle}>{t('tapToOpenSystemSettings')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={enableAll}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.quickActionText}>{t('enableAll')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={disableAll}>
            <Ionicons name="close-circle" size={20} color="#F44336" />
            <Text style={styles.quickActionText}>{t('disableAll')}</Text>
          </TouchableOpacity>
        </View>

        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 {t('pushNotifications')}</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="notifications" size={24} color={theme.colors.primary} />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>{t('enablePushNotifications')}</Text>
                <Text style={styles.preferenceDesc}>{t('enablePushNotificationsDesc')}</Text>
              </View>
            </View>
            <Switch
              value={preferences.push_enabled}
              onValueChange={() => togglePreference('push_enabled')}
              trackColor={{ false: '#3e3e3e', true: theme.colors.primary }}
              thumbColor={preferences.push_enabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎉 {t('events')}</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="calendar" size={24} color="#FF9800" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>{t('newEvents')}</Text>
                <Text style={styles.preferenceDesc}>{t('newEventsDesc')}</Text>
              </View>
            </View>
            <Switch
              value={preferences.new_events}
              onValueChange={() => togglePreference('new_events')}
              trackColor={{ false: '#3e3e3e', true: theme.colors.primary }}
              thumbColor={preferences.new_events ? '#fff' : '#f4f3f4'}
              disabled={!preferences.push_enabled}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="alarm" size={24} color="#2196F3" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>{t('eventReminders')}</Text>
                <Text style={styles.preferenceDesc}>{t('eventRemindersDesc')}</Text>
              </View>
            </View>
            <Switch
              value={preferences.event_reminders}
              onValueChange={() => togglePreference('event_reminders')}
              trackColor={{ false: '#3e3e3e', true: theme.colors.primary }}
              thumbColor={preferences.event_reminders ? '#fff' : '#f4f3f4'}
              disabled={!preferences.push_enabled}
            />
          </View>
        </View>

        {/* Promotions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 {t('promotionsAndOffers')}</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="pricetag" size={24} color="#E91E63" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>{t('promotions')}</Text>
                <Text style={styles.preferenceDesc}>{t('promotionsDesc')}</Text>
              </View>
            </View>
            <Switch
              value={preferences.promotions}
              onValueChange={() => togglePreference('promotions')}
              trackColor={{ false: '#3e3e3e', true: theme.colors.primary }}
              thumbColor={preferences.promotions ? '#fff' : '#f4f3f4'}
              disabled={!preferences.push_enabled}
            />
          </View>
        </View>

        {/* Loyalty Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🪙 Invasion Coins</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>{t('invasionCoinsNotif')}</Text>
                <Text style={styles.preferenceDesc}>{t('invasionCoinsNotifDesc')}</Text>
              </View>
            </View>
            <Switch
              value={preferences.invasion_coins}
              onValueChange={() => togglePreference('invasion_coins')}
              trackColor={{ false: '#3e3e3e', true: theme.colors.primary }}
              thumbColor={preferences.invasion_coins ? '#fff' : '#f4f3f4'}
              disabled={!preferences.push_enabled}
            />
          </View>
        </View>

        {/* DJs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 DJs</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="musical-notes" size={24} color="#9C27B0" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>{t('djUpdates')}</Text>
                <Text style={styles.preferenceDesc}>{t('djUpdatesDesc')}</Text>
              </View>
            </View>
            <Switch
              value={preferences.dj_updates}
              onValueChange={() => togglePreference('dj_updates')}
              trackColor={{ false: '#3e3e3e', true: theme.colors.primary }}
              thumbColor={preferences.dj_updates ? '#fff' : '#f4f3f4'}
              disabled={!preferences.push_enabled}
            />
          </View>
        </View>

        {/* Email Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📧 Email</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="mail" size={24} color="#00BCD4" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>{t('newsletterEmail')}</Text>
                <Text style={styles.preferenceDesc}>{t('newsletterEmailDesc')}</Text>
              </View>
            </View>
            <Switch
              value={preferences.newsletter_email}
              onValueChange={() => togglePreference('newsletter_email')}
              trackColor={{ false: '#3e3e3e', true: theme.colors.primary }}
              thumbColor={preferences.newsletter_email ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.textMuted} />
          <Text style={styles.privacyText}>
            {t('notificationPrivacyNotice')}
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: theme.colors.cardBackground,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  systemBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 190, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 190, 0.3)',
  },
  systemBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  systemBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  systemBannerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  section: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  preferenceDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
});
