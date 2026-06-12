import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { theme } from '../src/config/theme';
import api from '../src/config/api';
import logger from '../src/config/logger';
import { useLanguage } from '../src/context/LanguageContext';
import { getDateLocale } from '../src/i18n/dateLocale';
import { ErrorRetry } from '../src/components/ErrorRetry';
import { SkeletonCard, SkeletonRow } from '../src/components/ui/Skeleton';
import { EmptyState } from '../src/components/ui/EmptyState';
import { PressableScale } from '../src/components/ui/PressableScale';
import { GlassCard } from '../src/components/ui/GlassCard';

interface Aftermovie {
  id: string;
  title: string;
  event_date: string;
  thumbnail_url: string;
  video_url: string;
  duration: string;
  views: number;
}

export default function AftermoviesScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<Aftermovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(false);
      // Load events that have aftermovie_visible + aftermovie_url
      const response = await api.get('/events');
      const eventsList = Array.isArray(response.data) ? response.data : (response.data.events || []);
      const eventVideos = eventsList
        .filter((event: any) => event.aftermovie_visible && event.aftermovie_url)
        .map((event: any) => ({
          id: event.id,
          title: event.name,
          event_date: event.event_date,
          thumbnail_url: event.banner_image || 'https://via.placeholder.com/800x450',
          video_url: event.aftermovie_url,
          duration: '--:--',
          views: 0
        }));
      setVideos(eventVideos);
    } catch (error) {
      logger.error('Failed to load aftermovies:', error);
      setVideos([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const openVideo = async (video: Aftermovie) => {
    if (!video.video_url) {
      return; // No video URL
    }
    
    try {
      const canOpen = await Linking.canOpenURL(video.video_url);
      if (canOpen) {
        await Linking.openURL(video.video_url);
      } else {
        logger.error('Cannot open URL:', video.video_url);
      }
    } catch (error) {
      logger.error('Error opening video:', error);
    }
  };

  const formatViews = (views: number | undefined) => {
    if (!views) return '0';
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadVideos}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('aftermoviesTitle')}</Text>
          </View>
        </View>

        {/* Featured Video */}
        {videos.length > 0 && (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>{t('latestVideo')}</Text>
            <PressableScale
              style={styles.featuredCard}
              onPress={() => openVideo(videos[0])}
              accessibilityLabel={videos[0].title || t('latestVideo')}
            >
              <Image
                source={{ uri: videos[0].thumbnail_url || 'https://via.placeholder.com/800x450?text=Video' }}
                style={styles.featuredImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
              <View style={styles.playOverlay}>
                <LinearGradient
                  colors={theme.gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.playButton}
                >
                  <Ionicons name="play" size={40} color="#000" />
                </LinearGradient>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredTitle}>{videos[0].title || 'Aftermovie'}</Text>
                <View style={styles.featuredMeta}>
                  {videos[0].views !== undefined && videos[0].views > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="eye" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.metaText}>{formatViews(videos[0].views)} {t('views')}</Text>
                    </View>
                  )}
                  {videos[0].duration && videos[0].duration !== '--:--' && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.metaText}>{videos[0].duration}</Text>
                    </View>
                  )}
                </View>
              </View>
            </PressableScale>
          </View>
        )}

        {/* All Videos */}
        <View style={styles.allVideosSection}>
          <Text style={styles.sectionTitle}>{t('allVideos')}</Text>
          
          {loading ? (
            <View style={styles.skeletons}>
              <SkeletonCard imageHeight={200} />
              <SkeletonRow />
              <SkeletonRow />
            </View>
          ) : error ? (
            <ErrorRetry onRetry={loadVideos} />
          ) : videos.length === 0 ? (
            <EmptyState
              icon="film-outline"
              title={t('noVideoAvailable')}
              subtitle={t('aftermoviesComingSoon')}
            />
          ) : (
            videos.map((video, index) => (
              <PressableScale
                key={video.id}
                style={styles.videoCard}
                onPress={() => openVideo(video)}
                accessibilityLabel={video.title}
              >
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: video.thumbnail_url }}
                    style={styles.thumbnail}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration}</Text>
                  </View>
                  <View style={styles.smallPlayButton}>
                    <Ionicons name="play" size={20} color="white" />
                  </View>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                  <Text style={styles.videoDate}>
                    {video.event_date ? new Date(video.event_date).toLocaleDateString(getDateLocale(language), {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : t('dateNotSet')}
                  </Text>
                  <View style={styles.videoStats}>
                    <Ionicons name="eye" size={12} color={theme.colors.textMuted} />
                    <Text style={styles.statsText}>{formatViews(video.views)} {t('views')}</Text>
                  </View>
                </View>
              </PressableScale>
            ))
          )}
        </View>

        {/* Social CTA */}
        <GlassCard variant="glow" style={styles.socialSection}>
          <Text style={styles.socialTitle}>🔔 {t('stayConnected')}</Text>
          <Text style={styles.socialText}>
            {t('followUsForAftermovies')}
          </Text>
          <View style={styles.socialButtons}>
            <PressableScale
              style={[styles.socialButton, { backgroundColor: '#E4405F' }]}
              onPress={() => Linking.openURL('https://www.instagram.com/invasionlatina/')}
              accessibilityLabel="Instagram"
            >
              <Ionicons name="logo-instagram" size={24} color="white" />
            </PressableScale>
            <PressableScale
              style={[styles.socialButton, { backgroundColor: '#000' }]}
              onPress={() => Linking.openURL('https://www.tiktok.com/@invasionlatina')}
              accessibilityLabel="TikTok"
            >
              <Ionicons name="logo-tiktok" size={24} color="white" />
            </PressableScale>
            <PressableScale
              style={[styles.socialButton, { backgroundColor: '#FF0000' }]}
              onPress={() => Linking.openURL('https://www.youtube.com/@invasionlatina')}
              accessibilityLabel="YouTube"
            >
              <Ionicons name="logo-youtube" size={24} color="white" />
            </PressableScale>
          </View>
        </GlassCard>
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
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xl,
    paddingTop: 60,
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

  // Section Title
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },

  // Featured Video
  featuredSection: {
    marginBottom: theme.spacing.xl,
  },
  featuredCard: {
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.borders.brand,
    ...theme.shadows.neon,
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 5,
    ...theme.shadows.neon,
  },
  featuredInfo: {
    padding: theme.spacing.md,
  },
  featuredTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  // All Videos
  allVideosSection: {
    marginBottom: theme.spacing.xl,
  },
  videoCard: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.borders.subtle,
  },
  thumbnailContainer: {
    width: 140,
    height: 90,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },
  smallPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -15,
    marginLeft: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  videoInfo: {
    flex: 1,
    padding: theme.spacing.sm,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  videoDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },

  // Loading
  skeletons: {
    paddingHorizontal: theme.spacing.xl,
  },

  // Social CTA
  socialSection: {
    marginHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  socialTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  socialText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
