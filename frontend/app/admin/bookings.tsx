import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/config/api';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_name: string;
  event_date: string;
  zone: string;
  package: string;
  guest_count: number;
  total_price: number;
  special_requests: string;
  status: string;
  submitted_at: string;
}

export default function BookingsAdminScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('pending');

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Accès refusé', 'Cette page est réservée aux administrateurs');
      router.replace('/(tabs)/home');
    }
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/vip-bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.put(`/admin/vip-bookings/${bookingId}`, { status: newStatus });
      Alert.alert('Succès', `Réservation ${newStatus === 'confirmed' ? 'confirmée' : 'annulée'}`);
      loadBookings();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la réservation');
    }
  };

  const deleteBooking = async (bookingId: string) => {
    try {
      await api.delete(`/admin/vip-bookings/${bookingId}`);
      Alert.alert('Succès', 'Réservation supprimée!');
      loadBookings();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de la suppression';
      Alert.alert('Erreur', message);
    }
  };

  const handleDeleteBooking = (bookingId: string, customerName: string) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous vraiment supprimer la réservation de "${customerName}"?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => deleteBooking(bookingId)
        }
      ]
    );
  };

  const clearAllBookings = async () => {
    try {
      await api.delete('/admin/vip-bookings/clear-all');
      Alert.alert('Succès', 'Toutes les réservations ont été effacées!');
      loadBookings();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de la suppression';
      Alert.alert('Erreur', message);
    }
  };

  const handleClearAllBookings = () => {
    Alert.alert(
      'Effacer toutes les réservations',
      'Voulez-vous vraiment supprimer TOUTES les réservations? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Tout effacer', 
          style: 'destructive',
          onPress: () => clearAllBookings()
        }
      ]
    );
  };
      ]
    );
  };

  const openWhatsApp = (booking: Booking) => {
    const message = `Bonjour ${booking.customer_name}! 🎉

Votre réservation pour Invasion Latina est ${booking.status === 'confirmed' ? 'CONFIRMÉE ✅' : 'en attente de confirmation'}.

📍 Salle: ${booking.zone}
📦 Table: ${booking.package}
👥 Personnes: ${booking.guest_count}
💰 Prix: ${booking.total_price}€

📅 Date: ${new Date(booking.event_date).toLocaleDateString('fr-FR')}

Merci et à bientôt! 🔥`;

    const phoneNumber = booking.customer_phone.replace(/\+/g, '').replace(/\s/g, '');
    const whatsappUrl = Platform.select({
      ios: `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`,
      android: `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`,
      default: `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
    });

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Erreur', 'WhatsApp n\'est pas installé');
    });
  };

  const filteredBookings = bookings.filter(b => 
    filter === 'all' ? true : b.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return theme.colors.success;
      case 'cancelled': return theme.colors.error;
      default: return theme.colors.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'cancelled': return 'Annulé';
      default: return 'En attente';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réservations Tables</Text>
        <TouchableOpacity onPress={loadBookings} style={styles.backButton}>
          <Ionicons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{bookings.filter(b => b.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>
            {bookings.filter(b => b.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>Confirmées</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {bookings.reduce((sum, b) => b.status === 'confirmed' ? sum + b.total_price : sum, 0)}€
          </Text>
          <Text style={styles.statLabel}>Revenus</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {(['pending', 'confirmed', 'cancelled', 'all'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Toutes' : f === 'pending' ? 'En attente' : f === 'confirmed' ? 'Confirmées' : 'Annulées'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Clear All Button */}
      {bookings.length > 0 && (
        <View style={styles.clearAllSection}>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAllBookings}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.clearAllButtonText}>Effacer toutes les réservations</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bookings List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadBookings} tintColor={theme.colors.primary} />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Aucune réservation</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                  {getStatusLabel(booking.status)}
                </Text>
              </View>

              {/* Customer Info */}
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{booking.customer_name}</Text>
                <Text style={styles.customerContact}>{booking.customer_email}</Text>
                <Text style={styles.customerContact}>{booking.customer_phone}</Text>
              </View>

              {/* Booking Details */}
              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color={theme.colors.textMuted} />
                  <Text style={styles.detailText}>{booking.zone} - {booking.package}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people" size={16} color={theme.colors.textMuted} />
                  <Text style={styles.detailText}>{booking.guest_count} personnes</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={16} color={theme.colors.textMuted} />
                  <Text style={[styles.detailText, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                    {booking.total_price}€
                  </Text>
                </View>
                {booking.special_requests && (
                  <View style={styles.detailRow}>
                    <Ionicons name="chatbubble" size={16} color={theme.colors.textMuted} />
                    <Text style={styles.detailText}>{booking.special_requests}</Text>
                  </View>
                )}
              </View>

              {/* Date */}
              <Text style={styles.dateText}>
                Réservé le {new Date(booking.submitted_at).toLocaleDateString('fr-FR')} à {new Date(booking.submitted_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                {/* WhatsApp Button */}
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => openWhatsApp(booking)}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                  <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                </TouchableOpacity>

                {booking.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => updateBookingStatus(booking.id, 'confirmed')}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Confirmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        Alert.alert(
                          'Annuler la réservation',
                          `Êtes-vous sûr de vouloir annuler la réservation de ${booking.customer_name}?`,
                          [
                            { text: 'Non', style: 'cancel' },
                            { text: 'Oui, annuler', style: 'destructive', onPress: () => updateBookingStatus(booking.id, 'cancelled') }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </>
                )}

                {/* Cancel button for confirmed bookings */}
                {booking.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      Alert.alert(
                        'Annuler la réservation',
                        `Êtes-vous sûr de vouloir annuler la réservation CONFIRMÉE de ${booking.customer_name}?\n\nCette action est irréversible.`,
                        [
                          { text: 'Non', style: 'cancel' },
                          { text: 'Oui, annuler', style: 'destructive', onPress: () => updateBookingStatus(booking.id, 'cancelled') }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                )}

                {/* Delete button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteBooking(booking.id, booking.customer_name)}
                >
                  <Ionicons name="trash" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevated,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
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
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.secondary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 4,
  },

  // Filters
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.bold,
  },
  filterTextActive: {
    color: 'white',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
  },
  customerInfo: {
    marginBottom: theme.spacing.sm,
  },
  customerName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  customerContact: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  bookingDetails: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  dateText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  whatsappButtonText: {
    color: 'white',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  cancelButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
  },
  deleteButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  
  // Clear All Section
  clearAllSection: {
    paddingHorizontal: theme.spacing.md,
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
});
