import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../src/config/theme';
import api from '../src/config/api';

interface Event {
  id: string;
  name: string;
  event_date: string;
  banner_image?: string;
}

export default function GalleriesScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      // Filter past events that have photos
      const pastEvents = response.data.filter((e: Event) => 
        new Date(e.event_date) < new Date()
      );
      setEvents(pastEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadEvents}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>📸 Galeries Photos</Text>
            <Text style={styles.subtitle}>Revivez les meilleurs moments</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Les photos des événements seront ajoutées après chaque soirée!
          </Text>
        </View>

        {/* Events List */}
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Aucune galerie disponible</Text>
            <Text style={styles.emptySubtext}>
              Les photos seront publiées après le prochain événement
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => {
                // Future: Navigate to event gallery
                console.log('Open gallery for event:', event.id);
              }}
            >
              {event.banner_image ? (
                <Image
                  source={{ uri: event.banner_image }}
                  style={styles.eventImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.eventImage, styles.placeholderImage]}>
                  <Ionicons name="camera" size={48} color={theme.colors.textMuted} />
                </View>
              )}
              
              <View style={styles.eventOverlay}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventDate}>
                  {new Date(event.event_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              
              <View style={styles.viewButton}>
                <Ionicons name="images" size={20} color="white" />
                <Text style={styles.viewButtonText}>Voir photos</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Coming Soon Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>🎉 Bientôt disponible</Text>
          <View style={styles.featureCard}>
            <Ionicons name="search" size={24} color={theme.colors.neonPink} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Tag Yourself</Text>
              <Text style={styles.featureDesc}>Retrouve-toi dans les photos</Text>
            </View>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="download" size={24} color={theme.colors.neonBlue} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Téléchargement</Text>
              <Text style={styles.featureDesc}>Télécharge tes photos préférées</Text>
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

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
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

  // Event Card
  eventCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBackground,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: theme.colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  eventName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  eventDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
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
});