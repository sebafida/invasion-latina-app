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
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../src/config/theme';
import api from '../src/config/api';
import { useLanguage } from '../src/context/LanguageContext';

interface EventGallery {
  id: string;
  name: string;
  event_date: string;
  cover_image?: string;
  facebook_album_url?: string;
}

export default function GalleriesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [galleries, setGalleries] = useState<EventGallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/media/galleries');
      // Filter only events with facebook_album_url
      const galleriesWithLinks = response.data.filter((g: EventGallery) => g.facebook_album_url);
      setGalleries(galleriesWithLinks);
    } catch (error) {
      console.error('Failed to load galleries:', error);
      setGalleries([]);
    } finally {
      setLoading(false);
    }
  };

  const openFacebookAlbum = async (gallery: EventGallery) => {
    if (gallery.facebook_album_url) {
      try {
        await Linking.openURL(gallery.facebook_album_url);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le lien Facebook');
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
            <Text style={styles.title}>{t('galleriesTitle') || 'Photos'}</Text>
            <Text style={styles.subtitle}>{t('reliveTheBestMoments') || 'Revivez les meilleurs moments'}</Text>
          </View>
        </View>

        {/* Galleries List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : galleries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>{t('noGalleryAvailable') || 'Aucune galerie disponible'}</Text>
            <Text style={styles.emptySubtext}>
              {t('photosPublishedAfterEvent') || 'Les photos seront publiées après chaque événement'}
            </Text>
          </View>
        ) : (
          galleries.map((gallery) => (
            <View key={gallery.id} style={styles.galleryCard}>
              {/* Event Flyer */}
              {gallery.cover_image ? (
                <Image
                  source={{ uri: gallery.cover_image }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.galleryImage, styles.placeholderImage]}>
                  <Ionicons name="images" size={48} color={theme.colors.textMuted} />
                </View>
              )}
              
              {/* Event Info */}
              <View style={styles.galleryInfo}>
                <Text style={styles.galleryName}>{gallery.name}</Text>
                <Text style={styles.galleryDate}>
                  {new Date(gallery.event_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              
              {/* Facebook Link Button */}
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => openFacebookAlbum(gallery)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-facebook" size={20} color="white" />
                <Text style={styles.viewButtonText}>Voir les photos</Text>
                <Ionicons name="open-outline" size={18} color="white" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  galleryCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  galleryImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryInfo: {
    padding: 16,
  },
  galleryName: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  galleryDate: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 8,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: theme.fontWeight.semiBold,
  },
});
