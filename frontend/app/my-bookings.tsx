import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import api from '../src/config/api';
import { theme } from '../src/styles/theme';

interface Booking {
  id: string;
  event_name: string;
  event_date: string | null;
  event_banner: string | null;
  venue_name: string | null;
  zone: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'rejected';
  admin_notes: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  rejected_at: string | null;
}

export default function MyBookingsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vip/my-bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { icon: 'checkmark-circle', color: theme.colors.success, label: 'Confirmée' };
      case 'rejected':
        return { icon: 'close-circle', color: theme.colors.error, label: 'Refusée' };
      default:
        return { icon: 'time', color: theme.colors.warning, label: 'En attente' };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (dateString: string | null) => {
    if (!dateString) return true;
    return new Date(dateString) > new Date();
  };

  // Separate upcoming and past bookings
  const upcomingBookings = bookings.filter(b => isUpcoming(b.event_date));
  const pastBookings = bookings.filter(b => !isUpcoming(b.event_date));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <Text style={styles.headerTitle}>Mes Réservations</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune réservation</Text>
            <Text style={styles.emptySubtitle}>
              Vos réservations de tables apparaîtront ici
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/(tabs)/shop')}
            >
              <Text style={styles.bookButtonText}>Réserver une table</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>À venir</Text>
                {upcomingBookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
                  return (
                    <View key={booking.id} style={styles.bookingCard}>
                      {/* Event Banner */}
                      {booking.event_banner && (
                        <Image
                          source={{ uri: booking.event_banner }}
                          style={styles.eventBanner}
                          resizeMode="cover"
                        />
                      )}
                      
                      {/* Status Badge */}
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                        <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                          {statusInfo.label}
                        </Text>
                      </View>

                      {/* Booking Info */}
                      <View style={styles.bookingInfo}>
                        <Text style={styles.eventName}>{booking.event_name}</Text>
                        
                        <View style={styles.infoRow}>
                          <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
                          <Text style={styles.infoText}>{formatDate(booking.event_date)}</Text>
                        </View>

                        {booking.venue_name && (
                          <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
                            <Text style={styles.infoText}>{booking.venue_name}</Text>
                          </View>
                        )}

                        <View style={styles.detailsRow}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Zone</Text>
                            <Text style={styles.detailValue}>{booking.zone}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Personnes</Text>
                            <Text style={styles.detailValue}>{booking.guests}</Text>
                          </View>
                        </View>

                        {/* Admin Message */}
                        {booking.admin_notes && (
                          <View style={styles.adminMessage}>
                            <Ionicons name="chatbubble-outline" size={14} color={theme.colors.primary} />
                            <Text style={styles.adminMessageText}>{booking.admin_notes}</Text>
                          </View>
                        )}

                        {/* Submitted Date */}
                        <Text style={styles.submittedDate}>
                          Demande envoyée le {formatDate(booking.submitted_at)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historique</Text>
                {pastBookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
                  return (
                    <View key={booking.id} style={[styles.bookingCard, styles.pastCard]}>
                      {/* Status Badge */}
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                        <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                          {statusInfo.label}
                        </Text>
                      </View>

                      {/* Booking Info */}
                      <View style={styles.bookingInfo}>
                        <Text style={styles.eventName}>{booking.event_name}</Text>
                        
                        <View style={styles.infoRow}>
                          <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
                          <Text style={styles.infoText}>{formatDate(booking.event_date)}</Text>
                        </View>

                        <View style={styles.detailsRow}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Zone</Text>
                            <Text style={styles.detailValue}>{booking.zone}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Personnes</Text>
                            <Text style={styles.detailValue}>{booking.guests}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevated,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
  },
  bookButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bookingCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  pastCard: {
    opacity: 0.7,
  },
  eventBanner: {
    width: '100%',
    height: 120,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.md,
    marginBottom: 0,
    gap: 4,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  bookingInfo: {
    padding: theme.spacing.md,
  },
  eventName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.xl,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  adminMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  adminMessageText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
  submittedDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: theme.spacing.xxl,
  },
});
