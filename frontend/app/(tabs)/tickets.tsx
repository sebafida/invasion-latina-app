import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/config/theme';
import { useLanguage } from '../../src/context/LanguageContext';
import { getDateLocale } from '../../src/i18n/dateLocale';
import api from '../../src/config/api';
import logger from '../../src/config/logger';
import { ErrorRetry } from '../../src/components/ErrorRetry';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { PressableScale } from '../../src/components/ui/PressableScale';
import { SkeletonCard } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  venue_name: string;
  venue_address: string;
  banner_image?: string;
  ticket_categories: Array<{
    name: string;
    price: number;
  }>;
  xceed_ticket_url?: string;
  status: string;
}

// Default event flyer image
const DEFAULT_EVENT_FLYER = require('../../assets/images/event-flyer.jpg');

export default function TicketsScreen() {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await api.get('/events/for-tickets');
      const eventsList = response.data.events || response.data || [];
      setEvents(eventsList);
    } catch (error) {
      logger.error('Failed to load events:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(getDateLocale(language), options);
  };

  const handleBuyTickets = async (event: Event) => {
    if (!event.xceed_ticket_url) {
      Alert.alert(
        t('comingSoon'),
        t('comingSoonFeature')
      );
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(event.xceed_ticket_url);
      if (canOpen) {
        await Linking.openURL(event.xceed_ticket_url);
      } else {
        Alert.alert(t('error'), t('connectionError'));
      }
    } catch (error) {
      logger.error('Failed to open XCEED link:', error);
      Alert.alert(t('error'), t('connectionError'));
    }
  };

  const handleAddToCalendar = (event: Event) => {
    const startDate = new Date(event.event_date);
    const endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);
    const title = event.name;
    const location = event.venue_name + ', ' + (event.venue_address || 'Bruxelles');

    if (Platform.OS === 'ios') {
      // iOS: open hosted .ics
      const icsUrl = `https://invasion-latina-app-production.up.railway.app/api/calendar/${event.id}`;
      Linking.openURL(icsUrl).catch(() => {
        // Fallback: share event details
        Share.share({
          message: `${title}\n${new Date(event.event_date).toLocaleDateString(getDateLocale(language), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n${location}`,
        });
      });
    } else {
      // Android: Google Calendar
      const encodedTitle = encodeURIComponent(title);
      const encodedLocation = encodeURIComponent(location);
      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&location=${encodedLocation}`;
      Linking.openURL(googleCalUrl);
    }
  };

  const getPriceRange = (categories: Array<{ name: string; price: number }>) => {
    if (!categories || categories.length === 0) return t('comingSoon');
    const prices = categories.map(c => c.price);
    const min = Math.min(...prices);
    // Show only minimum price
    return `${min}€`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadEvents}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.content}>
        {/* Events List */}
        {error ? (
          <ErrorRetry onRetry={loadEvents} />
        ) : loading && events.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <SkeletonCard imageHeight={220} />
            <SkeletonCard imageHeight={220} />
          </View>
        ) : events.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={t('noEventScheduled')}
            subtitle={t('comingSoonFeature')}
          />
        ) : (
          events.map((event, index) => (
            <GlassCard
              key={event.id}
              variant={index === 0 ? 'glow' : 'default'}
              noPadding
              style={styles.eventCard}
            >
              {/* Event Flyer + overlay caption */}
              <View style={styles.bannerContainer}>
                <Image
                  source={event.banner_image ? { uri: event.banner_image } : DEFAULT_EVENT_FLYER}
                  style={styles.eventBanner}
                  contentFit="cover"
                  transition={250}
                />
                <LinearGradient
                  colors={theme.gradients.overlayBottom}
                  style={styles.bannerOverlay}
                >
                  <Text style={styles.bannerTitle} numberOfLines={2}>{event.name}</Text>
                  <View style={styles.bannerDateRow}>
                    <Ionicons name="calendar" size={14} color={theme.colors.primary} />
                    <Text style={styles.bannerDate}>{formatDate(event.event_date)}</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Event Info */}
              <View style={styles.eventInfo}>
                {/* Venue */}
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color={theme.colors.primary} />
                  <Text style={styles.infoText}>{event.venue_name}</Text>
                </View>

                {/* Price Range */}
                <View style={styles.priceContainer}>
                  <Ionicons name="pricetag" size={16} color={theme.colors.secondary} />
                  <Text style={styles.priceText}>
                    {getPriceRange(event.ticket_categories)}
                  </Text>
                </View>

                {/* Description */}
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>

                {/* Buy Button */}
                <GradientButton
                  title={event.xceed_ticket_url ? t('buyOnXceed') : t('comingSoon')}
                  icon="ticket"
                  variant="gold"
                  disabled={!event.xceed_ticket_url}
                  onPress={() => handleBuyTickets(event)}
                />

                {/* Info Note */}
                {event.xceed_ticket_url && (
                  <Text style={styles.noteText}>
                    XCEED
                  </Text>
                )}

                {/* Add to Calendar */}
                <PressableScale
                  onPress={() => handleAddToCalendar(event)}
                  style={styles.calendarButton}
                  accessibilityLabel={t('addToCalendar') || 'Ajouter au calendrier'}
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                  <Text style={styles.calendarButtonText}>{t('addToCalendar') || 'Ajouter au calendrier'}</Text>
                </PressableScale>
              </View>
            </GlassCard>
          ))
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>{t('informations')}</Text>
          <GlassCard style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              • {t('ticketsSoldViaXceed')}
            </Text>
            <Text style={styles.infoBoxText}>
              • {t('confirmationByEmail')}
            </Text>
            <Text style={styles.infoBoxText}>
              • {t('qrCodeSent')}
            </Text>
            <Text style={styles.infoBoxText}>
              • {t('refundConditions')}
            </Text>
          </GlassCard>
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
    paddingBottom: 110,
    paddingTop: theme.spacing.lg,
  },

  skeletonWrap: {
    paddingHorizontal: theme.spacing.xl,
  },

  // Event Card
  eventCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  bannerContainer: {
    position: 'relative',
  },
  eventBanner: {
    width: '100%',
    height: 220,
  },
  bannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.md,
    justifyContent: 'flex-end',
  },
  bannerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    letterSpacing: 0.4,
  },
  bannerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  bannerDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },

  // Event Info
  eventInfo: {
    padding: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(255, 215, 0, 0.10)',
    borderWidth: 1,
    borderColor: theme.borders.gold,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  priceText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.secondary,
    marginLeft: theme.spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  eventDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  noteText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.borders.brand,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(0, 229, 204, 0.06)',
  },
  calendarButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },

  // Info Section
  infoSection: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  infoSectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  infoBox: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  infoBoxText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
});
