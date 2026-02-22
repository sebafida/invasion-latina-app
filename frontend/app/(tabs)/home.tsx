import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import api from '../../src/config/api';

const { width } = Dimensions.get('window');

// Spotify Playlist URL
const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/5Pzn91AFtN8tBYYF8Wuci5?si=akXNRmENTPCpS-XWtD1AfQ';

// DJ Photos
const DJ_PHOTOS: { [key: string]: any } = {
  'DJ GIZMO': require('../../assets/images/dj-gizmo.png'),
  'DJ DNK': require('../../assets/images/dj-dnk.png'),
  'DJ CRUZ': require('../../assets/images/dj-cruz.png'),
  'DJ DANIEL MURILLO': require('../../assets/images/dj-daniel-murillo.png'),
  'DJ SUNCEE': require('../../assets/images/dj-suncee.png'),
  'DJ SAMO': require('../../assets/images/dj-samo.png'),
  'DJ MABOY': require('../../assets/images/dj-maboy.png'),
  'MC VELASQUEZ': require('../../assets/images/mc-velasquez.png'),
};

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
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [lineup, setLineup] = useState<any[]>(getDefaultLineup(t));
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    loadNextEvent();
  }, []);
  
  useEffect(() => {
    if (nextEvent) {
      const interval = setInterval(() => {
        calculateCountdown();
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [nextEvent]);
  
  const loadNextEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/next');
      const event = response.data.event;
      setNextEvent(event);
      
      // Load lineup based on selected DJs for this event
      if (event?.selected_djs && event.selected_djs.length > 0) {
        loadSelectedDJs(event.selected_djs);
      } else {
        // If no DJs selected, load all DJs
        loadLineup();
      }
    } catch (error) {
      console.error('Failed to load event:', error);
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
          .filter((dj: any) => selectedDjIds.includes(dj.id))
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
  
  const calculateCountdown = () => {
    if (!nextEvent) return;
    
    const eventDate = new Date(nextEvent.event_date);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
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
  
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadNextEvent} tintColor={theme.colors.primary} />
      }
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
        
        {/* Countdown Section */}
        {nextEvent && (
          <View style={styles.eventSection}>
            <View style={styles.eventHeader}>
              <Text style={styles.sectionTitle}>{t('nextEvent')}</Text>
            </View>
            
            <View style={styles.eventCard}>
              <Text style={styles.eventName}>{nextEvent.name}</Text>
              <Text style={styles.eventVenue}>
                📍 {nextEvent.venue_name}
              </Text>
              <Text style={styles.eventDate}>
                {new Date(nextEvent.event_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              
              {/* Countdown */}
              <View style={styles.countdownContainer}>
                <CountdownBox value={countdown.days} label={t('daysLeft')} />
                <CountdownBox value={countdown.hours} label={t('hoursLeft')} />
                <CountdownBox value={countdown.minutes} label={t('minutesLeft')} />
                <CountdownBox value={countdown.seconds} label={t('secondsLeft')} />
              </View>
              
              <TouchableOpacity 
                style={styles.buyButton}
                onPress={() => {
                  if (nextEvent?.xceed_ticket_url) {
                    Linking.openURL(nextEvent.xceed_ticket_url);
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
            </View>
          </View>
        )}
        
        {/* Quick Actions - No Title */}
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
    </ScrollView>
  );
}

const CountdownBox = ({ value, label }: { value: number; label: string }) => (
  <View style={styles.countdownBox}>
    <Text style={styles.countdownValue}>{value.toString().padStart(2, '0')}</Text>
    <Text style={styles.countdownLabel}>{label}</Text>
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
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
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
  
  // Countdown
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  countdownBox: {
    flex: 1,
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 28,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },
  countdownLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  
  // Buy Button
  buyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
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
    ...theme.shadows.md,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
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