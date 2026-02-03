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
import { useRouter } from 'expo-router';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/config/api';

interface DJRequest {
  id: string;
  song_title: string;
  artist_name: string;
  user_name: string;
  votes: number;
  times_requested: number;
  requested_at: string;
}

const REJECT_REASONS = [
  { value: 'not_reggaeton', label: 'Pas reggaeton' },
  { value: 'kills_vibe', label: 'Tue l\'ambiance' },
  { value: 'already_played', label: 'Déjà joué' },
  { value: 'explicit', label: 'Contenu explicite' },
  { value: 'technical', label: 'Problème technique' },
];

export default function DJDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<DJRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, played: 0, rejected: 0 });

  useEffect(() => {
    // Check if admin
    if (user?.role !== 'admin') {
      Alert.alert('Accès refusé', 'Cette page est réservée aux admins');
      router.back();
      return;
    }
    
    loadRequests();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadRequests();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.get('/dj/requests');
      setRequests(response.data);
      
      // Calculate stats
      setStats({
        total: response.data.length,
        pending: response.data.length,
        played: 0, // Will be updated when we track played songs
        rejected: 0,
      });
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleMarkAsPlayed = async (requestId: string, songTitle: string) => {
    Alert.alert(
      'Marquer comme joué',
      `${songTitle} a été joué?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, joué',
          onPress: async () => {
            try {
              await api.post(`/dj/admin/update-request/${requestId}`, {
                status: 'played'
              });
              Alert.alert('Succès', 'Chanson marquée comme jouée! ✅');
              loadRequests();
            } catch (error: any) {
              const message = error.response?.data?.detail || 'Erreur';
              Alert.alert('Erreur', message);
            }
          }
        }
      ]
    );
  };

  const handleReject = async (requestId: string, songTitle: string) => {
    Alert.alert(
      'Rejeter la demande',
      `Pourquoi rejeter "${songTitle}"?`,
      [
        { text: 'Annuler', style: 'cancel' },
        ...REJECT_REASONS.map(reason => ({
          text: reason.label,
          onPress: async () => {
            try {
              await api.post(`/dj/admin/update-request/${requestId}`, {
                status: 'rejected',
                rejection_reason: reason.value
              });
              Alert.alert('Rejeté', `"${songTitle}" a été rejeté`);
              loadRequests();
            } catch (error: any) {
              const message = error.response?.data?.detail || 'Erreur';
              Alert.alert('Erreur', message);
            }
          }
        }))
      ]
    );
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>🎧 DJ Dashboard</Text>
            <Text style={styles.subtitle}>Gérez les demandes en temps réel</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>{stats.played}</Text>
            <Text style={styles.statLabel}>Joués</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.error }]}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejetés</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <TouchableOpacity 
          style={styles.loyaltyScannerButton}
          onPress={() => router.push('/admin/loyalty-scanner')}
        >
          <View style={styles.loyaltyScannerIcon}>
            <Ionicons name="qr-code" size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.loyaltyScannerText}>
            <Text style={styles.loyaltyScannerTitle}>🎫 Scanner Fidélité</Text>
            <Text style={styles.loyaltyScannerDesc}>Scanner les QR codes des clients</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Les requêtes sont triées par votes. Rafraîchissement automatique toutes les 10s.
          </Text>
        </View>

        {/* Requests List */}
        <View style={styles.requestsList}>
          <Text style={styles.listTitle}>Requêtes en cours</Text>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={64} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>Aucune requête pour le moment</Text>
            </View>
          ) : (
            requests.map((request, index) => (
              <View key={request.id} style={styles.requestCard}>
                {/* Rank */}
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>

                {/* Song Info */}
                <View style={styles.requestInfo}>
                  <Text style={styles.songTitle}>{request.song_title}</Text>
                  <Text style={styles.artistName}>{request.artist_name}</Text>
                  
                  <View style={styles.requestMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="person" size={14} color={theme.colors.textMuted} />
                      <Text style={styles.metaText}>{request.user_name}</Text>
                    </View>
                    
                    <View style={styles.metaItem}>
                      <Ionicons name="arrow-up" size={14} color={theme.colors.primary} />
                      <Text style={styles.metaText}>{request.votes} votes</Text>
                    </View>
                    
                    {request.times_requested > 1 && (
                      <View style={styles.metaItem}>
                        <Ionicons name="repeat" size={14} color={theme.colors.neonPink} />
                        <Text style={[styles.metaText, { color: theme.colors.neonPink }]}>
                          {request.times_requested}x
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.playedButton]}
                    onPress={() => handleMarkAsPlayed(request.id, request.song_title)}
                  >
                    <Ionicons name="checkmark" size={20} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(request.id, request.song_title)}
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Légende</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendIcon, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
            <Text style={styles.legendText}>Marquer comme joué</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendIcon, { backgroundColor: theme.colors.error }]}>
              <Ionicons name="close" size={16} color="white" />
            </View>
            <Text style={styles.legendText}>Rejeter la demande</Text>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerText: {
    flex: 1,
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

  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // Requests List
  requestsList: {
    paddingHorizontal: theme.spacing.xl,
  },
  listTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },

  // Request Card
  requestCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  requestInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  artistName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  requestMeta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playedButton: {
    backgroundColor: theme.colors.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },

  // Legend
  legendCard: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  legendTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  legendIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
