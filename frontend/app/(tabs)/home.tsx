import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Linking,
  Animated,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { Translations } from '../../src/i18n/translations';
import { getDateLocale } from '../../src/i18n/dateLocale';
import api from '../../src/config/api';
import logger from '../../src/config/logger';
import { WhatsAppButton } from '../../src/components/WhatsAppButton';
import { ErrorRetry } from '../../src/components/ErrorRetry';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { PressableScale } from '../../src/components/ui/PressableScale';
import { Countdown } from '../../src/components/ui/Countdown';
import { Skeleton } from '../../src/components/ui/Skeleton';

const { width } = Dimensions.get('window');

// Spotify Playlist URL
const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/5Pzn91AFtN8tBYYF8Wuci5?si=akXNRmENTPCpS-XWtD1AfQ';

import { DJ_PHOTOS } from '../../src/config/djs';

// Default DJs (will be replaced by event-specific lineup from API)
const getDefaultLineup = (t: (key: keyof Translations) => string) => [
  { id: '1', name: 'DJ GIZMO', role: t('residentDj') },
  { id: '2', name: 'DJ DNK', role: t('residentDj') },
  { id: '3', name: 'DJ CRUZ', role: t('residentDj') },
  { id: '4', name: 'DJ DANIEL MURILLO', role: t('residentDj') },
  { id: '5', name: 'DJ SUNCEE', role: t('residentDj') },
  { id: '6', name: 'MC VELASQUEZ', role: 'MC' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [lineup, setLineup] = useState<any[]>(getDefaultLineup(t));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Scroll tracking for WhatsApp button
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await api.get('/events/upcoming');
      const events = response.data.events || [];
      setUpcomingEvents(events);

      // Load lineup based on first event's selected DJs
      if (events.length > 0 && events[0]?.selected_djs && events[0].selected_djs.length > 0) {
        loadSelectedDJs(events[0].selected_djs);
      } else {
        loadLineup();
      }
    } catch (error) {
      logger.error('Failed to load events:', error);
      // Fallback to old endpoint
      try {
        const response = await api.get('/events/next');
        if (response.data.event) {
          setUpcomingEvents([response.data.event]);
        }
      } catch (e) {
        logger.error('Fallback also failed:', e);
        setError(true);
      }
      loadLineup();
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDJs = async (selectedDjIds: string[]) => {
    try {
      const response = await api.get('/djs');
      if (response.data && response.data.length > 0) {
        // Filter only selected DJs
        const selectedDjs = response.data
          .filter((dj: any) => selectedDjIds.includes(String(dj.id)))
          .map((dj: any) => ({
            id: dj.id,
            name: dj.name,
            role: dj.type === 'mc' ? 'MC' : t('residentDj')
          }));

        if (selectedDjs.length > 0) {
          setLineup(selectedDjs);
        }
      }
    } catch (error) {
      logger.error('Failed to load selected DJs:', error);
    }
  };

  const loadLineup = async () => {
    try {
      const response = await api.get('/djs');
      if (response.data && response.data.length > 0) {
        // Map API response to lineup format
        const djsFromApi = response.data.map((dj: any) => ({
          id: dj.id,
          name: dj.name,
          role: dj.type === 'mc' ? 'MC' : t('residentDj')
        }));
        setLineup(djsFromApi);
      }
    } catch (error) {
      logger.error('Failed to load DJs:', error);
      // Keep default lineup
    }
  };

  // Get display name - "Familia" for guests, first name for logged in users
  const getDisplayName = () => {
    if (!user) {
      return 'Familia';
    }

    const name = user.name || '';

    // Check if it's a default/placeholder name (Apple Sign In users)
    const isPlaceholder = !name ||
      name.toLowerCase() === 'user' ||
      name.toLowerCase().startsWith('user') ||
      name === 'Nuevo Miembro' ||
      name === 'Amigo' ||
      /^[a-f0-9-]{20,}$/i.test(name); // UUID-like strings

    if (isPlaceholder) {
      // Try to get name from email (only for non-Apple users)
      const email = user.email || '';
      if (email && !email.includes('privaterelay.appleid.com')) {
        const emailName = email.split('@')[0];
        // Remove numbers and special chars, capitalize
        const cleanName = emailName.replace(/[0-9._-]/g, ' ').trim();
        if (cleanName.length > 0) {
          return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).split(' ')[0];
        }
      }
      // For Apple Sign In users, return empty string (just show "Bienvenue")
      return '';
    }

    // Get first name only (split by space and take first part)
    const firstName = name.split(' ')[0];
    return firstName;
  };

  // Get welcome message
  const getWelcomeMessage = () => {
    const displayName = getDisplayName();
    if (displayName) {
      return `${t('welcome')} ${displayName}!`;
    }
    return t('welcome') + '!';
  };

  const handleShareEvent = (event: any) => {
    const dateStr = event.event_date
      ? new Date(event.event_date).toLocaleDateString(getDateLocale(language), { weekday: 'long', day: 'numeric', month: 'long' })
      : '';
    Share.share({
      message: `${event.name}\n${dateStr}\n${event.venue_name || ''}\n\n${t('shareEventMessage')}\nhttps://invasionlatina.be`,
    });
  };

  const countdownLabels = {
    days: t('daysLeft'),
    hours: t('hoursLeft'),
    minutes: t('minutesLeft'),
    seconds: t('secondsLeft'),
  };

  const isInitialLoading = loading && upcomingEvents.length === 0 && !error;

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadUpcomingEvents} tintColor={theme.colors.primary} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.userName}>{getWelcomeMessage()}</Text>

            <GlassCard variant="glow" noPadding style={styles.pointsCard}>
              <View style={styles.pointsInner}>
                <Ionicons name="star" size={14} color={theme.colors.secondary} />
                <Text style={styles.pointsText}>
                  {user?.loyalty_points || 0} {t('points')}
                </Text>
              </View>
            </GlassCard>
          </View>

          {/* Network error with retry */}
          {error && upcomingEvents.length === 0 && (
            <ErrorRetry onRetry={loadUpcomingEvents} />
          )}

          {/* Initial loading skeleton (replaces spinner) */}
          {isInitialLoading && (
            <View style={styles.eventSection}>
              <Skeleton width={160} height={14} style={{ marginBottom: theme.spacing.md }} />
              <GlassCard noPadding>
                <Skeleton width="100%" height={300} borderRadius={0} />
                <View style={{ padding: theme.spacing.lg }}>
                  <Skeleton width="70%" height={22} />
                  <Skeleton width="45%" height={14} style={{ marginTop: theme.spacing.sm }} />
                  <Skeleton width="100%" height={64} style={{ marginTop: theme.spacing.lg }} />
                </View>
              </GlassCard>
            </View>
          )}

          {/* Hero Events - flyer + fade + countdown */}
          {upcomingEvents.length > 0 && upcomingEvents.filter(e => e && e.id).map((event, index) => (
            <View key={event.id} style={[styles.eventSection, index > 0 && { marginTop: 0 }]}>
              {index === 0 && (
                <SectionTitle title={`${t('nextEvent')}${upcomingEvents.length > 1 ? 's' : ''}`} />
              )}

              <GlassCard
                variant={event.event_type === 'open_air' ? 'default' : 'glow'}
                noPadding
                style={styles.eventCard}
              >
                {event.banner_image ? (
                  <View style={styles.flyerWrap}>
                    <Image
                      source={{ uri: event.banner_image }}
                      style={styles.flyerImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                    <LinearGradient
                      colors={theme.gradients.overlayBottom}
                      style={styles.flyerFade}
                    />

                    {/* Date badge - gold glass */}
                    {event.event_date && (
                      <GlassCard variant="gold" noPadding style={styles.dateBadge}>
                        <View style={styles.dateBadgeInner}>
                          <Ionicons name="calendar" size={13} color={theme.colors.secondary} />
                          <Text style={styles.dateBadgeText}>
                            {new Date(event.event_date).toLocaleDateString(getDateLocale(language), {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </Text>
                        </View>
                      </GlassCard>
                    )}

                    {/* Title on the fade */}
                    <View style={styles.flyerContent}>
                      {event.event_type === 'open_air' && (
                        <View style={styles.openAirBadge}>
                          <Text style={styles.openAirBadgeText}>OPEN AIR</Text>
                        </View>
                      )}
                      <Text style={styles.eventName}>{event.name || 'Evenement'}</Text>
                      <View style={styles.venueRow}>
                        <Ionicons name="location" size={14} color={theme.colors.primary} />
                        <Text style={styles.eventVenue}>{event.venue_name || t('venueTbc')}</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noFlyerHeader}>
                    {event.event_type === 'open_air' && (
                      <View style={styles.openAirBadge}>
                        <Text style={styles.openAirBadgeText}>OPEN AIR</Text>
                      </View>
                    )}
                    <Text style={styles.eventName}>{event.name || 'Evenement'}</Text>
                    <View style={styles.venueRow}>
                      <Ionicons name="location" size={14} color={theme.colors.primary} />
                      <Text style={styles.eventVenue}>{event.venue_name || t('venueTbc')}</Text>
                    </View>
                    {event.event_date && (
                      <Text style={styles.eventDate}>
                        {new Date(event.event_date).toLocaleDateString(getDateLocale(language), {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.eventBody}>
                  {/* Countdown - isolated memoized component (no full-screen re-render) */}
                  {event.event_date && (
                    <View style={styles.countdownWrap}>
                      <Countdown targetDate={event.event_date} labels={countdownLabels} />
                    </View>
                  )}

                  <View style={styles.eventButtons}>
                    <View style={styles.buyButton}>
                      <GradientButton
                        title={t('buyTickets')}
                        icon="arrow-forward"
                        onPress={() => {
                          if (event?.xceed_ticket_url) {
                            Linking.openURL(event.xceed_ticket_url);
                          } else {
                            router.push('/(tabs)/tickets');
                          }
                        }}
                      />
                    </View>

                    <PressableScale
                      onPress={() => handleShareEvent(event)}
                      accessibilityLabel={t('shareEventMessage')}
                      style={styles.shareButton}
                    >
                      <Ionicons name="share-outline" size={20} color={theme.colors.textSecondary} />
                    </PressableScale>
                  </View>
                </View>
              </GlassCard>
            </View>
          ))}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <View style={styles.actionsGrid}>
              <ActionCard
                icon="musical-notes"
                title={t('djRequests')}
                subtitle={t('voteForSongs')}
                color={theme.colors.neonPink}
                onPress={() => router.push('/(tabs)/dj')}
              />
              <ActionCard
                icon="images"
                title={t('photos')}
                subtitle={t('eventGalleries')}
                color={theme.colors.primary}
                onPress={() => router.push('/galleries')}
              />
              <ActionCard
                icon="play-circle"
                title={t('aftermovies')}
                subtitle={t('watchRecap')}
                color={theme.colors.neonBlue}
                onPress={() => router.push('/aftermovies')}
              />
              <ActionCard
                icon="wine"
                title={t('booking')}
                subtitle={t('tables')}
                color={theme.colors.primary}
                onPress={() => router.push('/(tabs)/shop')}
              />
            </View>
          </View>

          {/* Spotify Playlist */}
          <PressableScale
            onPress={() => Linking.openURL(SPOTIFY_PLAYLIST_URL)}
            accessibilityLabel={t('spotifyPlaylist')}
            style={styles.spotifyWrap}
          >
            <GlassCard noPadding>
              <View style={styles.spotifyCard}>
                <View style={styles.spotifyIcon}>
                  <Image
                    source={require('../../assets/images/spotify-logo.png')}
                    style={styles.spotifyLogoImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.spotifyInfo}>
                  <Text style={styles.spotifyTitle}>{t('spotifyPlaylist')}</Text>
                  <Text style={styles.spotifySubtitle}>Que viva la música latina</Text>
                </View>
                <Ionicons name="open-outline" size={24} color="#1DB954" />
              </View>
            </GlassCard>
          </PressableScale>

          {/* Lineup - DJs Grid */}
          <View style={styles.lineupSection}>
            <SectionTitle title={t('lineup')} />

            <View style={styles.lineupGrid}>
              {lineup.map((dj: any, index: number) => (
                <View key={dj.id || index} style={styles.djCardWrap}>
                  <PressableScale
                    onPress={() => router.push('/(tabs)/djs')}
                    accessibilityLabel={dj.name}
                  >
                    <GlassCard noPadding style={styles.djCard}>
                    {DJ_PHOTOS[dj.name] ? (
                      <Image
                        source={DJ_PHOTOS[dj.name]}
                        style={styles.djPhoto}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={styles.djPhotoPlaceholder}>
                        <Ionicons
                          name={dj.role === 'MC' ? 'mic' : 'headset'}
                          size={28}
                          color={theme.colors.primary}
                        />
                      </View>
                    )}
                      <Text style={styles.djCardName} numberOfLines={1}>{dj.name}</Text>
                      <Text style={styles.djCardRole}>{dj.role}</Text>
                    </GlassCard>
                  </PressableScale>
                </View>
              ))}
            </View>
          </View>

          {/* Social Media Section */}
          <View style={styles.socialSection}>
            <SectionTitle title={t('socialNetworks')} />

            <View style={styles.socialGrid}>
              <SocialCard
                icon="logo-instagram"
                color="#E4405F"
                name="Instagram"
                url="https://www.instagram.com/invasionlatina/"
              />
              <SocialCard
                icon="logo-facebook"
                color="#1877F2"
                name="Facebook"
                url="https://www.facebook.com/invasionlatina/?locale=fr_FR"
              />
              <SocialCard
                icon="logo-tiktok"
                color="#FF0044"
                name="TikTok"
                url="https://www.tiktok.com/@invasionlatina"
              />
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* WhatsApp Floating Button */}
      <WhatsAppButton scrollY={scrollY} />
    </View>
  );
}

// Section title with a small turquoise gradient tick on the left
const SectionTitle = ({ title }: { title: string }) => (
  <View style={styles.sectionTitleRow}>
    <LinearGradient
      colors={theme.gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.sectionTick}
    />
    <Text style={styles.sectionTitleText}>{title}</Text>
  </View>
);

const ActionCard = ({
  icon,
  title,
  subtitle,
  color,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  color: string;
  onPress?: () => void;
}) => (
  <PressableScale onPress={onPress} accessibilityLabel={title} style={styles.actionCardWrap}>
    <GlassCard style={styles.actionCard}>
      <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </GlassCard>
  </PressableScale>
);

const SocialCard = ({
  icon,
  color,
  name,
  url,
}: {
  icon: any;
  color: string;
  name: string;
  url: string;
}) => (
  <View style={styles.socialCardWrap}>
    <PressableScale onPress={() => Linking.openURL(url)} accessibilityLabel={name}>
      <GlassCard noPadding style={styles.socialCard}>
        <View style={[styles.socialIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.socialName}>{name}</Text>
      </GlassCard>
    </PressableScale>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },

  content: {
    flex: 1,
    paddingBottom: 120, // floating glass tab bar
  },

  // Hero
  hero: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  userName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  pointsCard: {
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.full,
  },
  pointsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  pointsText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },

  // Section title with gradient tick
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTick: {
    width: 22,
    height: 3,
    borderRadius: 2,
  },
  sectionTitleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // Event
  eventSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  eventCard: {
    marginBottom: theme.spacing.md,
  },

  // Flyer hero
  flyerWrap: {
    position: 'relative',
  },
  flyerImage: {
    width: '100%',
    height: 320,
  },
  flyerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  flyerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
  },
  dateBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  dateBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  dateBadgeText: {
    color: theme.colors.secondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noFlyerHeader: {
    padding: theme.spacing.lg,
    paddingBottom: 0,
  },
  openAirBadge: {
    backgroundColor: '#4CAF5020',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#4CAF5050',
  },
  openAirBadgeText: {
    color: '#4CAF50',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  eventName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventVenue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  eventDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  eventBody: {
    padding: theme.spacing.lg,
  },
  countdownWrap: {
    marginBottom: theme.spacing.lg,
  },

  // Event buttons row
  eventButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  buyButton: {
    flex: 1,
  },
  shareButton: {
    width: 54,
    height: 54,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.borders.medium,
  },

  // Quick Actions
  quickActions: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  actionCardWrap: {
    width: (width - theme.spacing.xl * 2 - theme.spacing.xs * 4) / 2,
    margin: theme.spacing.xs,
  },
  actionCard: {
    minHeight: 120,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },

  // Lineup
  lineupSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  lineupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  djCardWrap: {
    width: '31%',
    marginBottom: theme.spacing.sm,
  },
  djCard: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  djPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: theme.spacing.xs,
  },
  djPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  djCardName: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  djCardRole: {
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  // Spotify
  spotifyWrap: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  spotifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#1DB954',
  },
  spotifyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1DB95420',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  spotifyLogoImage: {
    width: 32,
    height: 32,
  },
  spotifyInfo: {
    flex: 1,
  },
  spotifyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  spotifySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Social Media
  socialSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  socialGrid: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.xs,
  },
  socialCardWrap: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  socialCard: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  socialIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  socialName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});
