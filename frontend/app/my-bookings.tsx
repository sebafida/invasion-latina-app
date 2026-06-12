import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SkeletonCard, SkeletonRow } from '../src/components/ui/Skeleton';
import { EmptyState } from '../src/components/ui/EmptyState';
import { PressableScale } from '../src/components/ui/PressableScale';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { getDateLocale } from '../src/i18n/dateLocale';
import api from '../src/config/api';
import { theme } from '../src/config/theme';
import logger from '../src/config/logger';

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
  const { t, language } = useLanguage();
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
      logger.error('Failed to load bookings:', error);
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
        return { icon: 'checkmark-circle', color: theme.colors.success, label: t('statusConfirmed') };
      case 'rejected':
        return { icon: 'close-circle', color: theme.colors.error, label: t('statusRejected') };
      default:
        return { icon: 'time', color: theme.colors.warning, label: t('statusPending') };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('dateNotSet');
    const date = new Date(dateString);
    return date.toLocaleDateString(getDateLocale(language), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString(getDateLocale(language), {
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
      <View style={[styles.container, styles.skeletons]}>
        <SkeletonCard imageHeight={120} />
        <SkeletonRow />
        <SkeletonRow />
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
        <Text style={styles.headerTitle}>{t('myBookings')}</Text>
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
          <EmptyState
            icon="calendar-outline"
            title={t('noBookings')}
            subtitle={t('noBookingsSubtitle')}
            actionLabel={t('bookATable')}
            onAction={() => router.push('/(tabs)/shop')}
          />
        ) : (
          <>
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('upcoming')}</Text>
                {upcomingBookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
                  return (
                    <View key={booking.id} style={styles.bookingCard}>
                      {/* Event Banner */}
                      {booking.event_banner && (
                        <Image
                          source={{ uri: booking.event_banner }}
                          style={styles.eventBanner}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
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
                            <Text style={styles.detailLabel}>{t('zone')}</Text>
                            <Text style={styles.detailValue}>{booking.zone}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>{t('guestsLabel')}</Text>
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
                          {t('requestSentOn')} {formatDate(booking.submitted_at)}
                        </Text>

                        {/* Pending booking: estimated delay + WhatsApp contact */}
                        {booking.status === 'pending' && (
                          <View style={styles.pendingInfo}>
                            <View style={styles.pendingDelay}>
                              <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                              <Text style={styles.pendingDelayText}>{t('responseWithin24h')}</Text>
                            </View>
                            <PressableScale
                              style={styles.contactButton}
                              onPress={() => {
                                const msg = encodeURIComponent(t('whatsappBookingInquiry').replace('{event}', booking.event_name));
                                Linking.openURL(`https://wa.me/32478814497?text=${msg}`);
                              }}
                              accessibilityLabel={t('contactUs')}
                            >
                              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                              <Text style={styles.contactButtonText}>{t('contactUs')}</Text>
                            </PressableScale>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('history')}</Text>
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
                            <Text style={styles.detailLabel}>{t('zone')}</Text>
                            <Text style={styles.detailValue}>{booking.zone}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>{t('guestsLabel')}</Text>
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
    borderWidth: 1,
    borderColor: theme.borders.subtle,
  },
  skeletons: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 100,
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
  pendingInfo: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  pendingDelay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pendingDelayText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#25D366' + '15',
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    fontSize: theme.fontSize.sm,
    color: '#25D366',
    fontWeight: theme.fontWeight.semibold,
  },
  bottomSpacer: {
    height: theme.spacing.xxl,
  },
});
