import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../src/config/theme';
import api from '../src/config/api';

interface EventGallery {
  id: string;
  name: string;
  event_date: string;
  photo_count: number;
  cover_image?: string;
}

export default function GalleriesScreen() {
  const router = useRouter();
  const [galleries, setGalleries] = useState<EventGallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/media/galleries');
      setGalleries(response.data || []);
    } catch (error) {
      console.error('Failed to load galleries:', error);
      // Mock data for demo
      setGalleries([
        {
          id: 'demo-1',
          name: 'Invasion Latina - Summer Edition 2024',
          event_date: '2024-07-15T22:00:00',
          photo_count: 156,
          cover_image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800'
        },
        {
          id: 'demo-2',
          name: 'Invasion Latina - Halloween Special',
          event_date: '2024-10-31T22:00:00',
          photo_count: 203,
          cover_image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
        },
        {
          id: 'demo-3',
          name: 'Invasion Latina - New Year 2025',
          event_date: '2024-12-31T22:00:00',
          photo_count: 312,
          cover_image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openGallery = (gallery: EventGallery) => {
    router.push(`/gallery/${gallery.id}`);
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
            <Text style={styles.title}>📸 Galeries Photos</Text>
            <Text style={styles.subtitle}>Revivez les meilleurs moments</Text>
          </View>
        </View>

        {/* Tag Yourself Banner */}
        <View style={styles.tagBanner}>
          <View style={styles.tagIconContainer}>
            <Ionicons name="person-add" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.tagTextContainer}>
            <Text style={styles.tagTitle}>Tag Yourself! 🏷️</Text>
            <Text style={styles.tagDescription}>
              Retrouve-toi dans les photos et tague-toi pour les retrouver facilement
            </Text>
          </View>
        </View>

        {/* Galleries List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des galeries...</Text>
          </View>
        ) : galleries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Aucune galerie disponible</Text>
            <Text style={styles.emptySubtext}>
              Les photos seront publiées après le prochain événement
            </Text>
          </View>
        ) : (
          galleries.map((gallery) => (
            <TouchableOpacity
              key={gallery.id}
              style={styles.galleryCard}
              onPress={() => openGallery(gallery)}
              activeOpacity={0.8}
            >
              {gallery.cover_image ? (
                <Image
                  source={{ uri: gallery.cover_image }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.galleryImage, styles.placeholderImage]}>
                  <Ionicons name="camera" size={48} color={theme.colors.textMuted} />
                </View>
              )}
              
              <View style={styles.galleryOverlay}>
                <Text style={styles.galleryName}>{gallery.name}</Text>
                <View style={styles.galleryMeta}>
                  <Text style={styles.galleryDate}>
                    {new Date(gallery.event_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                  <View style={styles.photoCountBadge}>
                    <Ionicons name="images" size={14} color="white" />
                    <Text style={styles.photoCountText}>{gallery.photo_count}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Voir les photos</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Features Coming Soon */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>✨ Fonctionnalités</Text>
          
          <View style={styles.featureCard}>
            <Ionicons name="search" size={24} color={theme.colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Tag Yourself</Text>
              <Text style={styles.featureDesc}>Retrouve-toi dans les photos et tague-toi</Text>
            </View>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Disponible</Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <Ionicons name="download" size={24} color={theme.colors.neonBlue} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Téléchargement HD</Text>
              <Text style={styles.featureDesc}>Télécharge tes photos en haute qualité</Text>
            </View>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Disponible</Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <Ionicons name="share-social" size={24} color={theme.colors.secondary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Partage Social</Text>
              <Text style={styles.featureDesc}>Partage directement sur Instagram, etc.</Text>
            </View>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Disponible</Text>
            </View>
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
  loadingContainer: {
    paddingVertical: theme.spacing.xxl * 2,
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },

  // Gallery Card
  galleryCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBackground,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  galleryName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
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
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  viewButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
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
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
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
