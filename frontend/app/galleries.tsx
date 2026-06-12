import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
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
import { SkeletonCard } from '../src/components/ui/Skeleton';
import { EmptyState } from '../src/components/ui/EmptyState';
import { PressableScale } from '../src/components/ui/PressableScale';
import { GlassCard } from '../src/components/ui/GlassCard';

interface EventGallery {
  id: string;
  name: string;
  event_date: string;
  photo_count: number;
  cover_image?: string;
  gallery_url?: string;
}

export default function GalleriesScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [galleries, setGalleries] = useState<EventGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      setLoading(true);
      setError(false);
      // Load events and filter those with gallery_visible + gallery_url
      const response = await api.get('/events');
      const eventsList = Array.isArray(response.data) ? response.data : (response.data.events || []);
      const visibleGalleries = eventsList
        .filter((event: any) => event.gallery_visible && event.gallery_url)
        .map((event: any) => ({
          id: event.id,
          name: event.name,
          event_date: event.event_date,
          photo_count: 0,
          cover_image: event.banner_image || null,
          gallery_url: event.gallery_url,
        }));
      setGalleries(visibleGalleries);
    } catch (error) {
      logger.error('Failed to load galleries:', error);
      setGalleries([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const openGallery = async (gallery: EventGallery) => {
    if (gallery.gallery_url) {
      try {
        await Linking.openURL(gallery.gallery_url);
      } catch (error) {
        Alert.alert(t('error'), t('cannotOpenLink'));
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadGalleries}
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
            <Text style={styles.title}>{t('galleriesTitle')}</Text>
            <Text style={styles.subtitle}>{t('reliveTheBestMoments')}</Text>
          </View>
        </View>

        {/* Galleries List */}
        {loading ? (
          <View style={styles.skeletons}>
            <SkeletonCard imageHeight={200} />
            <SkeletonCard imageHeight={200} />
          </View>
        ) : error ? (
          <ErrorRetry onRetry={loadGalleries} />
        ) : galleries.length === 0 ? (
          <EmptyState
            icon="images-outline"
            title={t('noGalleryAvailable')}
            subtitle={t('photosPublishedAfterEvent')}
          />
        ) : (
          galleries.map((gallery) => (
            <PressableScale
              key={gallery.id}
              style={styles.galleryCard}
              onPress={() => openGallery(gallery)}
              accessibilityLabel={gallery.name}
            >
              {gallery.cover_image ? (
                <Image
                  source={{ uri: gallery.cover_image }}
                  style={styles.galleryImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.galleryImage, styles.placeholderImage]}>
                  <Ionicons name="images" size={48} color={theme.colors.textMuted} />
                </View>
              )}

              <LinearGradient
                colors={theme.gradients.overlayBottom}
                style={styles.galleryOverlay}
              >
                <Text style={styles.galleryName}>{gallery.name}</Text>
                <View style={styles.galleryMeta}>
                  <Text style={styles.galleryDate}>
                    {gallery.event_date ? new Date(gallery.event_date).toLocaleDateString(getDateLocale(language), {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : t('dateNotSet')}
                  </Text>
                  <View style={styles.photoCountBadge}>
                    <Ionicons name="images" size={14} color="white" />
                    <Text style={styles.photoCountText}>{gallery.photo_count}</Text>
                  </View>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={theme.gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.viewButton}
              >
                <Ionicons name="open-outline" size={18} color="#000" />
                <Text style={styles.viewButtonText}>{t('viewPhotos')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </LinearGradient>
            </PressableScale>
          ))
        )}

        {/* Features Coming Soon */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>{t('features')}</Text>
          
          <GlassCard style={styles.featureCard}>
            <Ionicons name="download" size={24} color={theme.colors.neonBlue} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('hdDownload')}</Text>
              <Text style={styles.featureDesc}>{t('downloadHdPhotos')}</Text>
            </View>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>{t('available')}</Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.featureCard}>
            <Ionicons name="share-social" size={24} color={theme.colors.secondary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('socialShare')}</Text>
              <Text style={styles.featureDesc}>{t('shareOnInstagram')}</Text>
            </View>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>{t('available')}</Text>
            </View>
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

  // Tag Banner
  tagBanner: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  tagIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  tagTextContainer: {
    flex: 1,
  },
  tagTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  tagDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // Loading
  skeletons: {
    paddingHorizontal: theme.spacing.xl,
  },

  // Gallery Card
  galleryCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.borders.subtle,
  },
  galleryImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: theme.colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 50,
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
  },
  galleryName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  galleryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryDate: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  photoCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  photoCountText: {
    color: 'white',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  viewButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#000',
    letterSpacing: 0.3,
  },

  // Features Section
  featuresSection: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  featuresTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  featureDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  availableBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  availableText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.bold,
  },
});
