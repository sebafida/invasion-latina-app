import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
  Linking,
  Animated,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import api from '../../src/config/api';
import { WhatsAppButton } from '../../src/components/WhatsAppButton';

const { width } = Dimensions.get('window');

// Spotify Playlist URL
const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/5Pzn91AFtN8tBYYF8Wuci5?si=akXNRmENTPCpS-XWtD1AfQ';

import { DJ_PHOTOS } from '../../src/config/djs';

// Default DJs (will be replaced by event-specific lineup from API)
const getDefaultLineup = (t: (key: string) => string) => [
  { id: '1', name: 'DJ GIZMO', role: t('residentDj') },
  { id: '2', name: 'DJ DNK', role: t('residentDj') },
  { id: '3', name: 'DJ CRUZ', role: t('residentDj') },
  { id: '4', name: 'DJ DANIEL MURILLO', role: t('residentDj') },
  { id: '5', name: 'DJ SUNCEE', role: t('residentDj') },
  { id: '6', name: 'MC VELASQUEZ', role: 'MC' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [lineup, setLineup] = useState<any[]>(getDefaultLineup(t));
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState<{[key: string]: { days: number, hours: number, minutes: number, seconds: number }}>({});
  
  // Scroll tracking for WhatsApp button
  const scrollY = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadUpcomingEvents();
  }, []);
  
  useEffect(() => {
    if (upcomingEvents.length > 0) {
      const interval = setInterval(() => {
        calculateCountdowns();
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [upcomingEvents]);
  
  const loadUpcomingEvents = async () => {
    try {
      setLoading(true);
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
      console.error('Failed to load events:', error);
      // Fallback to old endpoint
      try {
        const response = await api.get('/events/next');
        if (response.data.event) {
          setUpcomingEvents([response.data.event]);
        }
      } catch (e) {
        console.error('Fallback also failed:', e);
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
      console.error('Failed to load selected DJs:', error);
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
      console.error('Failed to load DJs:', error);
      // Keep default lineup
    }
  };
  
  const calculateCountdowns = () => {
    const newCountdowns: {[key: string]: { days: number, hours: number, minutes: number, seconds: number }} = {};
    
    upcomingEvents.forEach(event => {
      if (!event || !event.event_date) return;
      
      const eventDate = new Date(event.event_date);
      const now = new Date();
      const diff = eventDate.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        newCountdowns[event.id] = { days, hours, minutes, seconds };
      } else {
        newCountdowns[event.id] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    });
    
    setCountdowns(newCountdowns);
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
            
            <View style={styles.pointsCard}>
              <Text style={styles.pointsText}>
                {user?.loyalty_points || 0} {t('points')}
              </Text>
            </View>
          </View>
          
          {/* Countdown Section - Multiple Events */}
          {upcomingEvents.length > 0 && upcomingEvents.filter(e => e && e.id).map((event, index) => (
            <View key={event.id} style={[styles.eventSection, index > 0 && { marginTop: 0 }]}>
            {index === 0 && (
              <View style={styles.eventHeader}>
                <Text style={styles.sectionTitle}>{t('nextEvent')}{upcomingEvents.length > 1 ? 's' : ''}</Text>
              </View>
            )}
            
            <View style={[
              styles.eventCard,
              event.event_type === 'open_air' && styles.openAirEventCard
            ]}>
              {/* Flyer background image */}
              {event.banner_image && (
                <Image
                  source={{ uri: event.banner_image }}
                  style={styles.eventCardBg}
                  resizeMode="cover"
                />
              )}
              <View style={event.banner_image ? styles.eventCardOverlay : { padding: theme.spacing.lg }}>
                {event.event_type === 'open_air' && (
                  <View style={styles.openAirBadge}>
                    <Text style={styles.openAirBadgeText}>OPEN AIR</Text>
                  </View>
                )}
                <Text style={styles.eventName}>{event.name || 'Evenement'}</Text>
                <Text style={styles.eventVenue}>
                  {event.venue_name || 'Lieu a confirmer'}
                </Text>
                {event.event_date && (
                  <Text style={styles.eventDate}>
                    {new Date(event.event_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                )}

                {/* Countdown */}
                {countdowns[event.id] && (
                  <View style={styles.countdownContainer}>
                    <CountdownBox value={countdowns[event.id].days} label={t('daysLeft')} urgent={countdowns[event.id].days === 0} />
                    <CountdownBox value={countdowns[event.id].hours} label={t('hoursLeft')} urgent={countdowns[event.id].days === 0} />
                    <CountdownBox value={countdowns[event.id].minutes} label={t('minutesLeft')} urgent={countdowns[event.id].days === 0} />
                    <CountdownBox value={countdowns[event.id].seconds} label={t('secondsLeft')} urgent={countdowns[event.id].days === 0} />
                  </View>
                )}

                <View style={styles.eventButtons}>
                  <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => {
                      if (event?.xceed_ticket_url) {
                        Linking.openURL(event.xceed_ticket_url);
                      } else {
                        router.push('/(tabs)/tickets');
                      }
                    }}
                  >
                    <View style={styles.buyButtonContent}>
                      <Text style={styles.buyButtonText}>{t('buyTickets')}</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => {
                      const dateStr = event.event_date
                        ? new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                        : '';
                      Share.share({
                        message: `${event.name}\n${dateStr}\n${event.venue_name || ''}\n\nRejoins-moi pour la plus grande soiree latino reggaeton de Belgique !\nhttps://invasionlatina.be`,
                      });
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
        
        <View style={styles.sectionDivider} />
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

        <View style={styles.sectionDivider} />
        {/* Spotify Playlist */}
        <TouchableOpacity 
          style={styles.spotifyCard}
          onPress={() => Linking.openURL(SPOTIFY_PLAYLIST_URL)}
          activeOpacity={0.8}
        >
          <View style={styles.spotifyIcon}>
            <Image 
              source={require('../../assets/images/spotify-logo.png')}
              style={styles.spotifyLogoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.spotifyInfo}>
            <Text style={styles.spotifyTitle}>{t('spotifyPlaylist')}</Text>
            <Text style={styles.spotifySubtitle}>Que viva la música latina</Text>
          </View>
          <Ionicons name="open-outline" size={24} color="#1DB954" />
        </TouchableOpacity>
        
        {/* Lineup - DJs Grid */}
        <View style={styles.lineupSection}>
          <View style={styles.lineupHeader}>
            <Ionicons name="disc" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>{t('lineup')}</Text>
          </View>
          
          <View style={styles.lineupGrid}>
            {lineup.map((dj: any, index: number) => (
              <TouchableOpacity 
                key={dj.id || index} 
                style={styles.djCard}
                onPress={() => router.push('/(tabs)/djs')}
                activeOpacity={0.8}
              >
                {DJ_PHOTOS[dj.name] ? (
                  <Image
                    source={DJ_PHOTOS[dj.name]}
                    style={styles.djPhoto}
                    resizeMode="cover"
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
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionDivider} />
        {/* Social Media Section */}
        <View style={styles.socialSection}>
          <View style={styles.lineupHeader}>
            <Ionicons name="share-social" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>{t('socialNetworks')}</Text>
          </View>
          
          <View style={styles.socialGrid}>
            <TouchableOpacity 
              style={styles.socialCard}
              onPress={() => Linking.openURL('https://www.instagram.com/invasionlatina/')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#E4405F20' }]}>
                <Ionicons name="logo-instagram" size={28} color="#E4405F" />
              </View>
              <Text style={styles.socialName}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialCard}
              onPress={() => Linking.openURL('https://www.facebook.com/invasionlatina/?locale=fr_FR')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#1877F220' }]}>
                <Ionicons name="logo-facebook" size={28} color="#1877F2" />
              </View>
              <Text style={styles.socialName}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialCard}
              onPress={() => Linking.openURL('https://www.tiktok.com/@invasionlatina')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#FF004420' }]}>
                <Ionicons name="logo-tiktok" size={28} color="#FF0044" />
              </View>
              <Text style={styles.socialName}>TikTok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.ScrollView>
    
    {/* WhatsApp Floating Button */}
    <WhatsAppButton scrollY={scrollY} />
    </View>
  );
}

const CountdownBox = ({ value, label, urgent }: { value: number; label: string; urgent?: boolean }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (urgent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [urgent]);

  return (
    <Animated.View style={[
      styles.countdownBox,
      urgent && styles.countdownBoxUrgent,
      urgent && { transform: [{ scale: pulse }] },
    ]}>
      <Text style={[styles.countdownValue, urgent && styles.countdownValueUrgent]}>
        {value.toString().padStart(2, '0')}
      </Text>
      <Text style={styles.countdownLabel}>{label}</Text>
    </Animated.View>
  );
};

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
  <TouchableOpacity 
    style={styles.actionCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  
  content: {
    flex: 1,
    paddingBottom: 40,
  },
  
  // Hero
  hero: {
    padding: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  pointsText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  
  // Event
  eventSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  eventCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  eventCardBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  eventCardOverlay: {
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  featuredEventCard: {
    borderLeftColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FFD70050',
  },
  openAirEventCard: {
    borderLeftColor: '#4CAF50',
  },
  featuredBadge: {
    backgroundColor: '#FFD70020',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  featuredBadgeText: {
    color: '#FFD700',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  openAirBadge: {
    backgroundColor: '#4CAF5020',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  openAirBadgeText: {
    color: '#4CAF50',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  eventName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  eventVenue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  eventDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
  },
  
  // Countdown - Premium style
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  countdownBox: {
    flex: 1,
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '25',
    minHeight: 70,
  },
  countdownValue: {
    fontSize: 26,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
    lineHeight: 30,
  },
  countdownLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownBoxUrgent: {
    borderColor: theme.colors.primary + '60',
    backgroundColor: theme.colors.primary + '10',
  },
  countdownValueUrgent: {
    color: '#FFFFFF',
  },
  
  // Event buttons row
  eventButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  // Buy Button - with subtle neon glow
  buyButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.neon,
  },
  buyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  buyButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
    marginRight: theme.spacing.sm,
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBackground,
  },
  
  // Section divider
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.elevated,
    marginHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.lg,
  },
  // Quick Actions
  quickActions: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
    marginHorizontal: -theme.spacing.xs,
  },
  actionCard: {
    width: (width - theme.spacing.xl * 2 - theme.spacing.xs * 4) / 2,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    margin: theme.spacing.xs,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
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
  lineupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  lineupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  djCard: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
  spotifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
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
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  socialCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
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

  // Follow Section
  followSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  followTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});