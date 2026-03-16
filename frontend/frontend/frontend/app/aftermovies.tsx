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

interface EventAftermovie {
  id: string;
  name: string;
  event_date: string;
  cover_image?: string;
  instagram_aftermovie_url?: string;
}

export default function AftermoviesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [aftermovies, setAftermovies] = useState<EventAftermovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAftermovies();
  }, []);

  const loadAftermovies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/media/aftermovies-links');
      // Filter only events with instagram_aftermovie_url
      const aftermoviesWithLinks = response.data.filter((a: EventAftermovie) => a.instagram_aftermovie_url);
      setAftermovies(aftermoviesWithLinks);
    } catch (error) {
      console.error('Failed to load aftermovies:', error);
      setAftermovies([]);
    } finally {
      setLoading(false);
    }
  };

  const openInstagramAftermovie = async (aftermovie: EventAftermovie) => {
    if (aftermovie.instagram_aftermovie_url) {
      try {
        await Linking.openURL(aftermovie.instagram_aftermovie_url);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le lien Instagram');
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadAftermovies}
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
            <Text style={styles.title}>{t('aftermoviesTitle') || 'Aftermovies'}</Text>
            <Text style={styles.subtitle}>{t('reliveTheParty') || 'Revivez la soirée en vidéo'}</Text>
          </View>
        </View>

        {/* Aftermovies List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : aftermovies.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>{t('noAftermovieAvailable') || 'Aucun aftermovie disponible'}</Text>
            <Text style={styles.emptySubtext}>
              {t('aftermoviesPublishedSoon') || 'Les aftermovies seront publiés après chaque événement'}
            </Text>
          </View>
        ) : (
          aftermovies.map((aftermovie) => (
            <View key={aftermovie.id} style={styles.aftermovieCard}>
              {/* Event Flyer */}
              {aftermovie.cover_image ? (
                <Image
                  source={{ uri: aftermovie.cover_image }}
                  style={styles.aftermovieImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.aftermovieImage, styles.placeholderImage]}>
                  <Ionicons name="videocam" size={48} color={theme.colors.textMuted} />
                </View>
              )}
              
              {/* Play Icon Overlay */}
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
              </View>
              
              {/* Event Info */}
              <View style={styles.aftermovieInfo}>
                <Text style={styles.aftermovieName}>{aftermovie.name}</Text>
                <Text style={styles.aftermovieDate}>
                  {new Date(aftermovie.event_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              
              {/* Instagram Link Button */}
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => openInstagramAftermovie(aftermovie)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-instagram" size={20} color="white" />
                <Text style={styles.viewButtonText}>Voir l'aftermovie</Text>
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
  aftermovieCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  aftermovieImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  aftermovieInfo: {
    padding: 16,
  },
  aftermovieName: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  aftermovieDate: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4405F',
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
