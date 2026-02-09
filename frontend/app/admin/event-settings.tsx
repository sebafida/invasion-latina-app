import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';
import { useLanguage } from '../../src/context/LanguageContext';

interface AppSettings {
  requests_enabled: boolean;
  current_event_id: string | null;
  loyalty_qr_version: number;
  updated_at: string | null;
  updated_by: string | null;
}

export default function EventSettingsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      Alert.alert('Erreur', 'Impossible de charger les paramètres');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettings();
  };

  const toggleRequests = async () => {
    setActionLoading('toggle');
    try {
      const response = await api.post('/admin/settings/toggle-requests');
      Alert.alert('Succès', response.data.message);
      fetchSettings();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de modifier');
    } finally {
      setActionLoading(null);
    }
  };

  const startEvent = async () => {
    Alert.alert(
      'Démarrer l\'événement',
      'Cela va activer les demandes de chansons. Continuer?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: async () => {
            setActionLoading('start');
            try {
              const response = await api.post('/admin/settings/start-event');
              Alert.alert('🎉 Événement démarré!', response.data.message);
              fetchSettings();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de démarrer');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const endEvent = async () => {
    Alert.alert(
      '⚠️ Terminer l\'événement',
      'Cela va:\n• Désactiver les demandes de chansons\n• Supprimer les demandes en attente\n• Générer un nouveau QR code pour le prochain événement\n\nContinuer?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('end');
            try {
              const response = await api.post('/api/admin/settings/end-event');
              Alert.alert('✅ Événement terminé!', response.data.message);
              fetchSettings();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de terminer');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
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
          <Text style={styles.title}>⚙️ Paramètres Événement</Text>
          <Text style={styles.subtitle}>Gérer l'événement en cours</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>📊 État actuel</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Demandes de chansons:</Text>
            <View style={[
              styles.statusBadge,
              settings?.requests_enabled ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={styles.statusBadgeText}>
                {settings?.requests_enabled ? '🟢 ACTIVÉES' : '🔴 DÉSACTIVÉES'}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Version QR Code:</Text>
            <Text style={styles.statusValue}>v{settings?.loyalty_qr_version || 1}</Text>
          </View>

          {settings?.updated_at && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Dernière modif:</Text>
              <Text style={styles.statusValue}>
                {new Date(settings.updated_at).toLocaleString('fr-FR')}
              </Text>
            </View>
          )}

          {settings?.updated_by && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Par:</Text>
              <Text style={styles.statusValue}>{settings.updated_by}</Text>
            </View>
          )}
        </View>

        {/* Quick Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="musical-notes" size={24} color={theme.colors.primary} />
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Demandes de chansons</Text>
                <Text style={styles.toggleDesc}>Activer/Désactiver rapidement</Text>
              </View>
            </View>
            <Switch
              value={settings?.requests_enabled || false}
              onValueChange={toggleRequests}
              trackColor={{ false: '#3e3e3e', true: theme.colors.primary }}
              thumbColor={settings?.requests_enabled ? '#fff' : '#f4f3f4'}
              disabled={actionLoading === 'toggle'}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>🎛️ Actions</Text>

          {/* Start Event */}
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={startEvent}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'start' ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="play-circle" size={28} color="white" />
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionButtonText}>Démarrer l'événement</Text>
                  <Text style={styles.actionButtonDesc}>Active les demandes de chansons</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* End Event */}
          <TouchableOpacity
            style={[styles.actionButton, styles.endButton]}
            onPress={endEvent}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'end' ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="stop-circle" size={28} color="white" />
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionButtonText}>Terminer l'événement</Text>
                  <Text style={styles.actionButtonDesc}>Désactive tout & nouveau QR code</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>ℹ️ Informations</Text>
          
          <View style={styles.infoCard}>
            <Ionicons name="qr-code" size={20} color={theme.colors.neonBlue} />
            <Text style={styles.infoText}>
              Le QR code change automatiquement quand vous terminez un événement. Les anciens QR codes ne fonctionneront plus.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="location" size={20} color={theme.colors.secondary} />
            <Text style={styles.infoText}>
              Géolocalisation: Mirano Continental (50.8486, 4.3722) - Rayon: 50m
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="time" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Heures d'événement: 23h00 - 06h00
            </Text>
          </View>
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
    fontSize: 24,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  toggleCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleText: {
    marginLeft: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  toggleDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  endButton: {
    backgroundColor: '#F44336',
  },
  actionTextContainer: {
    marginLeft: 16,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButtonDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  infoSection: {
    marginTop: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
