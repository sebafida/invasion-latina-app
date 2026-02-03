import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  venue_name: string;
  venue_address: string;
  banner_image?: string;
  ticket_categories: Array<{
    name: string;
    price: number;
  }>;
  xceed_ticket_url?: string;
  status: string;
}

// Default event flyer image
const DEFAULT_EVENT_FLYER = require('../../assets/images/event-flyer.jpg');

export default function TicketsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      // Filter only upcoming events
      const upcomingEvents = response.data.filter((e: Event) => 
        e.status === 'upcoming' || e.status === 'published'
      );
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const handleBuyTickets = async (event: Event) => {
    if (!event.xceed_ticket_url) {
      Alert.alert(
        'Bientôt disponible',
        'Les billets pour cet événement seront bientôt disponibles!'
      );
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(event.xceed_ticket_url);
      if (canOpen) {
        await Linking.openURL(event.xceed_ticket_url);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de billetterie');
      }
    } catch (error) {
      console.error('Failed to open XCEED link:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de billetterie');
    }
  };

  const getPriceRange = (categories: Array<{ name: string; price: number }>) => {
    if (!categories || categories.length === 0) return 'Prix à venir';
    const prices = categories.map(c => c.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `${min}€`;
    return `${min}€ - ${max}€`;
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
          <Text style={styles.title}>🎫 Billetterie</Text>
          <Text style={styles.subtitle}>Réserve ta place maintenant!</Text>
        </View>

        {/* Events List */}
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Aucun événement à venir</Text>
            <Text style={styles.emptySubtext}>
              Les prochains événements seront bientôt annoncés!
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              {/* Event Banner */}
              {event.banner_image ? (
                <Image
                  source={{ uri: event.banner_image }}
                  style={styles.eventBanner}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.eventBanner, styles.placeholderBanner]}>
                  <Ionicons name="musical-notes" size={48} color={theme.colors.textMuted} />
                </View>
              )}

              {/* Event Info */}
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.name}</Text>
                
                {/* Date & Time */}
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                  <Text style={styles.infoText}>{formatDate(event.event_date)}</Text>
                </View>

                {/* Venue */}
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color={theme.colors.primary} />
                  <Text style={styles.infoText}>{event.venue_name}</Text>
                </View>

                {/* Price Range */}
                <View style={styles.priceContainer}>
                  <Ionicons name="pricetag" size={16} color={theme.colors.neonPink} />
                  <Text style={styles.priceText}>
                    {getPriceRange(event.ticket_categories)}
                  </Text>
                </View>

                {/* Description */}
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>

                {/* Buy Button */}
                <TouchableOpacity
                  style={[
                    styles.buyButton,
                    !event.xceed_ticket_url && styles.buyButtonDisabled
                  ]}
                  onPress={() => handleBuyTickets(event)}
                >
                  <Ionicons name="ticket" size={20} color="white" />
                  <Text style={styles.buyButtonText}>
                    {event.xceed_ticket_url ? 'Acheter sur XCEED' : 'Bientôt disponible'}
                  </Text>
                  {event.xceed_ticket_url && (
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  )}
                </TouchableOpacity>

                {/* Info Note */}
                {event.xceed_ticket_url && (
                  <Text style={styles.noteText}>
                    ℹ️ Vous serez redirigé vers XCEED pour finaliser votre achat
                  </Text>
                )}
              </View>
            </View>
          ))
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>💡 Informations</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              • Billets vendus via XCEED (plateforme sécurisée)
            </Text>
            <Text style={styles.infoBoxText}>
              • Confirmation par email après achat
            </Text>
            <Text style={styles.infoBoxText}>
              • QR Code d'entrée envoyé directement
            </Text>
            <Text style={styles.infoBoxText}>
              • Remboursement selon conditions XCEED
            </Text>
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
    padding: theme.spacing.xl,
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
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  eventBanner: {
    width: '100%',
    height: 200,
  },
  placeholderBanner: {
    backgroundColor: theme.colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Event Info
  eventInfo: {
    padding: theme.spacing.lg,
  },
  eventName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.neonPink + '20',
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  priceText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neonPink,
    marginLeft: theme.spacing.sm,
  },
  eventDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },

  // Buy Button
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  buyButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
    opacity: 0.6,
  },
  buyButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  noteText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },

  // Info Section
  infoSection: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  infoSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  infoBox: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoBoxText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
});
