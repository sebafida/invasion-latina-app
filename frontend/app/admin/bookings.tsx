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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
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
  const { t, language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('pending');

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [customRejectReason, setCustomRejectReason] = useState('');

  // Reject reasons for VIP bookings
  const REJECT_REASONS = [
    { value: 'fully_booked', label: 'Complet pour cette date', icon: 'calendar-outline' },
    { value: 'zone_unavailable', label: 'Zone demandée non disponible', icon: 'location-outline' },
    { value: 'minimum_guests', label: 'Nombre de personnes insuffisant', icon: 'people-outline' },
    { value: 'date_changed', label: 'Date de l\'événement modifiée', icon: 'time-outline' },
    { value: 'event_cancelled', label: 'Événement annulé', icon: 'close-circle-outline' },
    { value: 'custom', label: 'Autre raison...', icon: 'create-outline' },
  ];

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
      Alert.alert(t('success'), newStatus === 'confirmed' ? t('confirmed') : t('cancelled'));
      loadBookings();
    } catch (error) {
      Alert.alert(t('error'), t('connectionError'));
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return t('confirmed');
      case 'cancelled': return t('cancelled');
      default: return t('pending');
    }
  };

  const getLocale = () => {
    switch (language) {
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      case 'nl': return 'nl-NL';
      default: return 'fr-FR';
    }
  };

  const deleteBooking = async (bookingId: string) => {
    try {
      await api.delete(`/admin/vip-bookings/${bookingId}`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadBookings();
    } catch (error: any) {
      console.error('Delete error:', error);
    }
  };

  const handleDeleteBooking = (bookingId: string, customerName: string) => {
    setDeleteTarget({ id: bookingId, name: customerName });
    setShowDeleteModal(true);
  };

  const clearAllBookings = async () => {
    try {
      await api.delete('/admin/vip-bookings/clear-all');
      setShowClearAllModal(false);
      loadBookings();
    } catch (error: any) {
      console.error('Clear all error:', error);
    }
  };

  const handleClearAllBookings = () => {
    setShowClearAllModal(true);
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      await api.put(`/admin/vip-bookings/${bookingId}`, { status: 'cancelled' });
      setShowCancelModal(false);
      setCancelTarget(null);
      loadBookings();
    } catch (error: any) {
      console.error('Cancel error:', error);
    }
  };

  const handleCancelBooking = (bookingId: string, customerName: string) => {
    setCancelTarget({ id: bookingId, name: customerName });
    setShowCancelModal(true);
  };

  const handleRejectBooking = (bookingId: string, customerName: string) => {
    setRejectTarget({ id: bookingId, name: customerName });
    setCustomRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async (reason: { value: string; label: string }) => {
    if (!rejectTarget) return;
    
    try {
      const rejectionReason = reason.value === 'custom' ? customRejectReason : reason.label;
      await api.put(`/admin/vip-bookings/${rejectTarget.id}`, { 
        status: 'rejected',
        rejection_reason: rejectionReason 
      });
      Alert.alert('Refusé', `La réservation de "${rejectTarget.name}" a été refusée`);
      setShowRejectModal(false);
      setRejectTarget(null);
      setCustomRejectReason('');
      loadBookings();
    } catch (error) {
      Alert.alert(t('error'), t('connectionError'));
    }
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tableReservations')}</Text>
        <TouchableOpacity onPress={loadBookings} style={styles.backButton}>
          <Ionicons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{bookings.filter(b => b.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>{t('pending')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>
            {bookings.filter(b => b.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>{t('confirmed')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {bookings.reduce((sum, b) => b.status === 'confirmed' ? sum + b.total_price : sum, 0)}€
          </Text>
          <Text style={styles.statLabel}>{t('revenue')}</Text>
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
              {f === 'all' ? t('all') : f === 'pending' ? t('pending') : f === 'confirmed' ? t('confirmed') : t('cancelled')}
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
            <Text style={styles.clearAllButtonText}>{t('clearAllBookings')}</Text>
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
            <Text style={styles.emptyText}>{t('noResults')}</Text>
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
                  <Text style={styles.detailText}>{booking.guest_count} {t('people')}</Text>
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
                {t('reservedOn')} {new Date(booking.submitted_at).toLocaleDateString(getLocale())} - {new Date(booking.submitted_at).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}
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
                      <Text style={styles.actionButtonText}>{t('confirm')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleRejectBooking(booking.id, booking.customer_name)}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </>
                )}

                {/* Cancel button for confirmed bookings */}
                {booking.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleRejectBooking(booking.id, booking.customer_name)}
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

      {/* Delete Single Booking Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="trash" size={48} color={theme.colors.error} />
            <Text style={styles.deleteModalTitle}>{t('deleteBooking')}</Text>
            <Text style={styles.deleteModalSubtitle}>{t('bookingOf')} "{deleteTarget?.name}"</Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelBtn}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteModalConfirmBtn}
                onPress={() => deleteTarget && deleteBooking(deleteTarget.id)}
              >
                <Text style={styles.deleteModalConfirmText}>{t('delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear All Bookings Modal */}
      <Modal
        visible={showClearAllModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearAllModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="warning" size={48} color={theme.colors.error} />
            <Text style={styles.deleteModalTitle}>{t('clearAllBookings')}?</Text>
            <Text style={styles.deleteModalSubtitle}>{t('irreversibleAction')}</Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelBtn}
                onPress={() => setShowClearAllModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteModalConfirmBtn}
                onPress={() => clearAllBookings()}
              >
                <Text style={styles.deleteModalConfirmText}>{t('clearAll')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="close-circle" size={48} color={theme.colors.error} />
            <Text style={styles.deleteModalTitle}>{t('cancelBooking')}</Text>
            <Text style={styles.deleteModalSubtitle}>{t('bookingOf')} "{cancelTarget?.name}"</Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelBtn}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelTarget(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>{t('no')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteModalConfirmBtn}
                onPress={() => cancelTarget && cancelBooking(cancelTarget.id)}
              >
                <Text style={styles.deleteModalConfirmText}>{t('yes')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  deleteModalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  deleteModalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  deleteModalSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  deleteModalCancelBtn: {
    flex: 1,
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  deleteModalConfirmBtn: {
    flex: 1,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
});
