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
const DEFAULT_LINEUP = [
  { id: '1', name: 'DJ GIZMO', role: 'Resident DJ' },
  { id: '2', name: 'DJ DNK', role: 'Resident DJ' },
  { id: '3', name: 'DJ CRUZ', role: 'Resident DJ' },
  { id: '4', name: 'DJ DANIEL MURILLO', role: 'Resident DJ' },
  { id: '5', name: 'DJ SUNCEE', role: 'Resident DJ' },
  { id: '6', name: 'DJ SAMO', role: 'Resident DJ' },
  { id: '7', name: 'DJ MABOY', role: 'Resident DJ' },
  { id: '8', name: 'MC VELASQUEZ', role: 'MC' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [nextEvent, setNextEvent] = useState<any>(null);
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
      setNextEvent(response.data.event);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
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
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Party Lover'}! 🔥</Text>
          
          <View style={styles.pointsCard}>
            <Ionicons name="trophy" size={24} color={theme.colors.secondary} />
            <Text style={styles.pointsText}>
              {user?.loyalty_points || 0} Points
            </Text>
          </View>
        </View>
        
        {/* Countdown Section */}
        {nextEvent && (
          <View style={styles.eventSection}>
            <View style={styles.eventHeader}>
              <Text style={styles.sectionTitle}>Next Event</Text>
              <TouchableOpacity>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
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
                <CountdownBox value={countdown.days} label="Days" />
                <CountdownBox value={countdown.hours} label="Hours" />
                <CountdownBox value={countdown.minutes} label="Mins" />
                <CountdownBox value={countdown.seconds} label="Secs" />
              </View>
              
              <TouchableOpacity style={styles.buyButton}>
                <View style={styles.buyButtonContent}>
                  <Text style={styles.buyButtonText}>Buy Tickets</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <ActionCard
              icon="musical-notes"
              title="DJ Requests"
              subtitle="Vote for songs"
              color={theme.colors.neonPink}
              onPress={() => router.push('/(tabs)/dj')}
            />
            <ActionCard
              icon="ticket"
              title="Buy Tickets"
              subtitle="Get your spot"
              color={theme.colors.neonBlue}
              onPress={() => router.push('/(tabs)/tickets')}
            />
            <ActionCard
              icon="wine"
              title="VIP Tables"
              subtitle="Book now"
              color={theme.colors.primary}
              onPress={() => router.push('/(tabs)/shop')}
            />
            <ActionCard
              icon="camera"
              title="Photos"
              subtitle="Event galleries"
              color={theme.colors.secondary}
              onPress={() => router.push('/galleries')}
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
            <Ionicons name="musical-note" size={28} color="#1DB954" />
          </View>
          <View style={styles.spotifyInfo}>
            <Text style={styles.spotifyTitle}>🎵 Playlist Spotify</Text>
            <Text style={styles.spotifySubtitle}>Écoute nos hits avant la soirée!</Text>
          </View>
          <Ionicons name="open-outline" size={24} color="#1DB954" />
        </TouchableOpacity>
        
        {/* Tonight's Lineup - DJs with Photos */}
        <View style={styles.lineupSection}>
          <Text style={styles.sectionTitle}>Tonight's Lineup 🎧</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lineupScroll}
          >
            {(nextEvent?.lineup || DEFAULT_LINEUP).map((dj: any, index: number) => (
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
                      size={32} 
                      color={theme.colors.primary} 
                    />
                  </View>
                )}
                <Text style={styles.djCardName} numberOfLines={1}>{dj.name}</Text>
                <Text style={styles.djCardRole}>{dj.role}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  lineupScroll: {
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  djCard: {
    width: 100,
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
  },
  djPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: theme.spacing.xs,
  },
  djPhotoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  djCardName: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  djCardRole: {
    fontSize: 10,
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
});