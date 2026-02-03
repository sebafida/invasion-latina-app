import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../src/config/theme';
import api from '../src/config/api';

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
  const [videos, setVideos] = useState<Aftermovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/media/aftermovies');
      setVideos(response.data || []);
    } catch (error) {
      console.error('Failed to load aftermovies:', error);
      // Mock data for demo
      setVideos([
        {
          id: 'video-1',
          title: 'Invasion Latina - Summer Edition 2024',
          event_date: '2024-07-15T22:00:00',
          thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
          video_url: 'https://www.youtube.com/watch?v=example1',
          duration: '4:32',
          views: 15420
        },
        {
          id: 'video-2',
          title: 'Invasion Latina - Halloween Special',
          event_date: '2024-10-31T22:00:00',
          thumbnail_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
          video_url: 'https://www.youtube.com/watch?v=example2',
          duration: '5:15',
          views: 23150
        },
        {
          id: 'video-3',
          title: 'Invasion Latina - New Year 2025 🎆',
          event_date: '2024-12-31T22:00:00',
          thumbnail_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
          video_url: 'https://www.youtube.com/watch?v=example3',
          duration: '6:48',
          views: 45890
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (video: Aftermovie) => {
    Linking.openURL(video.video_url);
  };

  const formatViews = (views: number) => {
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
            <Text style={styles.title}>🎬 Aftermovies</Text>
            <Text style={styles.subtitle}>Revois les meilleures soirées</Text>
          </View>
        </View>

        {/* Featured Video */}
        {videos.length > 0 && (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>⭐ Dernière vidéo</Text>
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => openVideo(videos[0])}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: videos[0].thumbnail_url }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={40} color="white" />
                </View>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredTitle}>{videos[0].title}</Text>
                <View style={styles.featuredMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="eye" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>{formatViews(videos[0].views)} vues</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>{videos[0].duration}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* All Videos */}
        <View style={styles.allVideosSection}>
          <Text style={styles.sectionTitle}>📹 Toutes les vidéos</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Chargement des vidéos...</Text>
            </View>
          ) : videos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="film-outline" size={64} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>Aucune vidéo disponible</Text>
              <Text style={styles.emptySubtext}>Les aftermovies seront publiés bientôt!</Text>
            </View>
          ) : (
            videos.map((video, index) => (
              <TouchableOpacity
                key={video.id}
                style={styles.videoCard}
                onPress={() => openVideo(video)}
                activeOpacity={0.8}
              >
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: video.thumbnail_url }}
                    style={styles.thumbnail}
                    resizeMode="cover"
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
                    {new Date(video.event_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                  <View style={styles.videoStats}>
                    <Ionicons name="eye" size={12} color={theme.colors.textMuted} />
                    <Text style={styles.statsText}>{formatViews(video.views)} vues</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Social CTA */}
        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>🔔 Reste connecté!</Text>
          <Text style={styles.socialText}>
            Suis-nous sur les réseaux pour ne rater aucun aftermovie
          </Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#E4405F' }]}
              onPress={() => Linking.openURL('https://www.instagram.com/invasionlatina/')}
            >
              <Ionicons name="logo-instagram" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#000' }]}
              onPress={() => Linking.openURL('https://www.tiktok.com/@invasionlatina')}
            >
              <Ionicons name="logo-tiktok" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#FF0000' }]}
              onPress={() => Linking.openURL('https://www.youtube.com/@invasionlatina')}
            >
              <Ionicons name="logo-youtube" size={24} color="white" />
            </TouchableOpacity>
          </View>
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
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 5,
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
  loadingContainer: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },

  // Social CTA
  socialSection: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
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
