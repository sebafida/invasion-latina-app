import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
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
  status: string;
  rejection_label?: string;
}

interface EventStats {
  id: string;
  name: string;
  date: string | null;
  pending: number;
  played: number;
  rejected: number;
  total: number;
}

const REJECT_REASONS = [
  { value: 'not_appropriate', label: 'Pas approprié pour la soirée', icon: 'close-circle' },
  { value: 'already_played', label: 'Déjà passé ce soir', icon: 'checkmark-done' },
  { value: 'next_time', label: 'Ça sera pour la prochaine!', icon: 'calendar' },
  { value: 'not_in_library', label: 'Pas dans notre bibliothèque', icon: 'library' },
  { value: 'wrong_style', label: 'Ne correspond pas au style', icon: 'musical-notes' },
  { value: 'too_slow', label: 'Trop lent pour le moment', icon: 'speedometer' },
  { value: 'explicit_content', label: 'Contenu trop explicite', icon: 'warning' },
  { value: 'technical_issue', label: 'Problème technique', icon: 'construct' },
];

export default function DJDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<DJRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, played: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [events, setEvents] = useState<EventStats[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('default_event');
  const [showEventPicker, setShowEventPicker] = useState(false);
  
  // Reject modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DJRequest | null>(null);

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  useEffect(() => {
    // Delay check to allow navigation to mount
    const timer = setTimeout(() => {
      // Check if admin
      if (user?.role !== 'admin') {
        Alert.alert('Accès refusé', 'Cette page est réservée aux admins', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }
      
      loadEvents();
      loadRequests();
      
      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        loadRequests();
      }, 10000);
      
      return () => clearInterval(interval);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [statusFilter, selectedEvent]);

  const loadEvents = async () => {
    try {
      const response = await api.get('/dj/admin/all-requests');
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      let url = '/dj/requests?';
      if (statusFilter !== 'all') {
        url += `status=${statusFilter}&`;
      }
      if (selectedEvent) {
        url += `event_id=${selectedEvent}`;
      }
      
      const response = await api.get(url);
      setRequests(response.data);
      
      // Calculate stats from all requests for this event
      const allResponse = await api.get(`/dj/requests?event_id=${selectedEvent}`);
      const allData = allResponse.data;
      setStats({
        total: allData.length,
        pending: allData.filter((r: any) => r.status === 'pending').length,
        played: allData.filter((r: any) => r.status === 'played').length,
        rejected: allData.filter((r: any) => r.status === 'rejected').length,
      });
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPlayed = async (requestId: string, songTitle: string) => {
    try {
      await api.post(`/dj/admin/update-request/${requestId}`, {
        status: 'played'
      });
      // Reload requests to update the UI
      loadRequests();
      loadEvents();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de la mise à jour';
      Alert.alert('Erreur', message);
    }
  };

  const handleReject = (request: DJRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const confirmReject = async (reason: { value: string; label: string }) => {
    if (!selectedRequest) return;
    
    try {
      await api.post(`/dj/admin/update-request/${selectedRequest.id}`, {
        status: 'rejected',
        rejection_reason: reason.value,
        rejection_label: reason.label
      });
      Alert.alert('Rejeté', `"${selectedRequest.song_title}" a été rejeté`);
      setShowRejectModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur';
      Alert.alert('Erreur', message);
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      await api.delete(`/dj/requests/${requestId}`);
      Alert.alert('Succès', 'Demande supprimée!');
      loadRequests();
      loadEvents();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de la suppression';
      Alert.alert('Erreur', message);
    }
  };

  const handleDeleteRequest = (requestId: string, songTitle: string) => {
    // Use setTimeout to work around Expo Go Alert.alert issue
    setTimeout(() => {
      Alert.alert(
        'Supprimer',
        `Voulez-vous vraiment supprimer "${songTitle}"?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Supprimer', 
            style: 'destructive',
            onPress: () => deleteRequest(requestId)
          }
        ]
      );
    }, 100);
  };

  const clearAllRequests = async () => {
    try {
      await api.delete('/dj/requests/clear-all');
      Alert.alert('Succès', 'Toutes les demandes ont été effacées!');
      loadRequests();
      loadEvents();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de la suppression';
      Alert.alert('Erreur', message);
    }
  };

  const handleClearAllRequests = () => {
    // Use setTimeout to work around Expo Go Alert.alert issue
    setTimeout(() => {
      Alert.alert(
        'Effacer toutes les demandes',
        'Voulez-vous vraiment supprimer TOUTES les demandes de chansons? Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Tout effacer', 
            style: 'destructive',
            onPress: () => clearAllRequests()
          }
        ]
      );
    }, 100);
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
            <Text style={styles.title}>DJ Dashboard</Text>
            <Text style={styles.subtitle}>Gérez les demandes en temps réel</Text>
          </View>
        </View>

        {/* Event Selector */}
        {events.length > 1 && (
          <TouchableOpacity
            style={styles.eventSelector}
            onPress={() => setShowEventPicker(true)}
          >
            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
            <Text style={styles.eventSelectorText}>
              {events.find(e => e.id === selectedEvent)?.name || 'Événement actuel'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, statusFilter === 'all' && styles.statCardActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, statusFilter === 'pending' && styles.statCardActive]}
            onPress={() => setStatusFilter('pending')}
          >
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, statusFilter === 'played' && styles.statCardActive]}
            onPress={() => setStatusFilter('played')}
          >
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>{stats.played}</Text>
            <Text style={styles.statLabel}>Joués</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, statusFilter === 'rejected' && styles.statCardActive]}
            onPress={() => setStatusFilter('rejected')}
          >
            <Text style={[styles.statNumber, { color: theme.colors.error }]}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejetés</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Les requêtes sont triées par votes. Rafraîchissement automatique toutes les 10s.
          </Text>
        </View>

        {/* Clear All Button */}
        {stats.total > 0 && (
          <View style={styles.clearAllSection}>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAllRequests}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.clearAllButtonText}>Effacer toutes les demandes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Requests List */}
        <View style={styles.requestsList}>
          <Text style={styles.listTitle}>
            {statusFilter === 'all' ? 'Toutes les requêtes' : 
             statusFilter === 'pending' ? 'Requêtes en attente' :
             statusFilter === 'played' ? 'Chansons jouées' : 'Requêtes rejetées'}
          </Text>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={64} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>Aucune requête {statusFilter !== 'all' ? 'dans cette catégorie' : ''}</Text>
            </View>
          ) : (
            requests.map((request, index) => (
              <View key={request.id} style={[
                styles.requestCard,
                request.status === 'rejected' && styles.requestCardRejected,
                request.status === 'played' && styles.requestCardPlayed,
              ]}>
                {/* Rank */}
                <View style={[
                  styles.rankBadge,
                  request.status === 'rejected' && { backgroundColor: theme.colors.error + '30' },
                  request.status === 'played' && { backgroundColor: theme.colors.success + '30' },
                ]}>
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

                  {/* Status badge for rejected/played */}
                  {request.status === 'rejected' && request.rejection_label && (
                    <View style={styles.rejectionBadge}>
                      <Ionicons name="close-circle" size={14} color={theme.colors.error} />
                      <Text style={styles.rejectionText}>{request.rejection_label}</Text>
                    </View>
                  )}
                  {request.status === 'played' && (
                    <View style={styles.playedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                      <Text style={styles.playedText}>Joué!</Text>
                    </View>
                  )}
                </View>

                {/* Actions - only for pending requests */}
                {request.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.playedButton]}
                      onPress={() => handleMarkAsPlayed(request.id, request.song_title)}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(request)}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteRequest(request.id, request.song_title)}
                    >
                      <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Delete button for non-pending requests */}
                {request.status !== 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteRequest(request.id, request.song_title)}
                  >
                    <Ionicons name="trash" size={18} color="white" />
                  </TouchableOpacity>
                )}
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
          <View style={styles.legendRow}>
            <View style={[styles.legendIcon, { backgroundColor: '#666' }]}>
              <Ionicons name="trash" size={16} color="white" />
            </View>
            <Text style={styles.legendText}>Supprimer définitivement</Text>
          </View>
        </View>
      </View>

      {/* Reject Reason Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pourquoi rejeter?</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.selectedSongInfo}>
                <Text style={styles.selectedSongTitle}>{selectedRequest.song_title}</Text>
                <Text style={styles.selectedSongArtist}>{selectedRequest.artist_name}</Text>
              </View>
            )}

            <ScrollView style={styles.reasonsList}>
              {REJECT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={styles.reasonOption}
                  onPress={() => confirmReject(reason)}
                >
                  <View style={styles.reasonIconContainer}>
                    <Ionicons name={reason.icon as any} size={24} color={theme.colors.error} />
                  </View>
                  <Text style={styles.reasonText}>{reason.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowRejectModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  statCardActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
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

  // Event Selector
  eventSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  eventSelectorText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
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

  // Request card status variants
  requestCardRejected: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
    opacity: 0.8,
  },
  requestCardPlayed: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
    opacity: 0.8,
  },
  rejectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  rejectionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
  },
  playedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  playedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
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
  deleteButton: {
    backgroundColor: '#666',
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  clearAllButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
  },
  selectedSongInfo: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  selectedSongTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  selectedSongArtist: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  reasonsList: {
    maxHeight: 350,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  reasonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  cancelButton: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
});
