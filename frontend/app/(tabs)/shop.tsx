import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/config/api';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  name: string;
  event_date: string;
  banner_image?: string;
}

// Room types with their packages
const ROOMS = {
  main_room: {
    name: 'Main Room',
    icon: 'musical-notes',
    color: theme.colors.primary,
    description: 'Au cœur de l\'action, ambiance garantie!',
    packages: [
      {
        value: 'table_haute',
        label: 'Table Haute',
        price: 300,
        capacity: '4-6 personnes',
        features: ['Table debout', 'Vue sur la piste'],
      },
      {
        value: 'table_assise',
        label: 'Table Assise',
        price: 500,
        capacity: '6-8 personnes',
        features: ['Table avec banquette', 'Service dédié'],
      },
      {
        value: 'table_premium',
        label: 'Table Premium',
        price: 750,
        capacity: '8-10 personnes',
        features: ['Meilleur emplacement'],
      },
    ],
  },
  classy_room: {
    name: 'Classy Room',
    icon: 'wine',
    color: '#FFD700',
    description: 'L\'élégance dans une ambiance plus intimiste',
    packages: [
      {
        value: 'table_haute',
        label: 'Table Haute',
        price: 300,
        capacity: '4-6 personnes',
        features: ['Table debout'],
      },
      {
        value: 'table_assise',
        label: 'Table Assise',
        price: 500,
        capacity: '6-8 personnes',
        features: ['Table avec banquette', 'Service personnalisé'],
      },
      {
        value: 'table_premium',
        label: 'Table Premium',
        price: 750,
        capacity: '8-10 personnes',
        features: ['Espace privatif', 'Service exclusif'],
      },
    ],
  },
  vip: {
    name: 'VIP',
    icon: 'diamond',
    color: '#E91E63',
    description: 'Le summum du luxe et de l\'exclusivité',
    packages: [
      {
        value: 'table_haute',
        label: 'Table Haute VIP',
        price: 500,
        capacity: '4-6 personnes',
        features: ['Table premium', 'Accès VIP lounge', 'Entrée prioritaire groupe'],
      },
      {
        value: 'table_assise',
        label: 'Table Assise VIP',
        price: 1000,
        capacity: '8-10 personnes',
        features: ['Table luxe avec banquette', 'Service VIP dédié', 'Entrée prioritaire groupe'],
      },
      {
        value: 'table_presidentiel',
        label: 'Table Présidentielle',
        price: 1500,
        capacity: '10-15 personnes',
        features: ['Espace privé exclusif', 'Service butler', 'Entrée prioritaire groupe'],
      },
    ],
  },
};

type RoomKey = keyof typeof ROOMS;

export default function VIPBookingScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<RoomKey>('main_room');
  const [selectedPackage, setSelectedPackage] = useState('table_haute');
  const [guestCount, setGuestCount] = useState('6');
  const [bottlePreferences, setBottlePreferences] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    // Reset package when room changes
    setSelectedPackage('table_haute');
  }, [selectedRoom]);

  const loadEvents = async () => {
    try {
      const response = await api.get('/events');
      const upcomingEvents = response.data.filter((e: Event) => 
        new Date(e.event_date) > new Date()
      );
      setEvents(upcomingEvents);
      if (upcomingEvents.length > 0) {
        setSelectedEvent(upcomingEvents[0].id);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const getCurrentRoom = () => ROOMS[selectedRoom];
  
  const getSelectedPackageDetails = () => {
    return getCurrentRoom().packages.find(p => p.value === selectedPackage);
  };

  const handleSubmitBooking = async () => {
    if (!selectedEvent) {
      Alert.alert('Erreur', 'Veuillez sélectionner un événement');
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs de contact');
      return;
    }

    const packageDetails = getSelectedPackageDetails();
    if (!packageDetails) return;

    try {
      setLoading(true);

      const bookingData = {
        event_id: selectedEvent,
        zone: selectedRoom,
        package: selectedPackage,
        guest_count: parseInt(guestCount),
        bottle_preferences: bottlePreferences.trim(),
        special_requests: specialRequests.trim(),
        total_price: packageDetails.price,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
      };

      await api.post('/vip/book', bookingData);

      Alert.alert(
        'Demande envoyée! 🍾',
        'Votre demande de réservation VIP a été reçue. Nous vous contacterons sous 24h pour confirmer.',
        [
          {
            text: 'OK',
            onPress: () => {
              setBottlePreferences('');
              setSpecialRequests('');
              setGuestCount('6');
            }
          }
        ]
      );
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de la réservation';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const currentRoom = getCurrentRoom();
  const packageDetails = getSelectedPackageDetails();
  
  // Get the current event's flyer
  const currentEvent = events.find(e => e.id === selectedEvent);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Table Booking</Text>
          <Text style={styles.subtitle}>Réserve ta table pour une soirée inoubliable</Text>
        </View>

        {/* Event Flyer */}
        {currentEvent?.banner_image ? (
          <View style={styles.flyerSection}>
            <Image
              source={{ uri: currentEvent.banner_image }}
              style={styles.flyerImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={styles.flyerSection}>
            <Image
              source={require('../../assets/images/event-flyer.jpg')}
              style={styles.flyerImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Room Tabs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Choisis ta salle</Text>
          <View style={styles.tabsContainer}>
            {(Object.keys(ROOMS) as RoomKey[]).map((roomKey) => {
              const room = ROOMS[roomKey];
              const isSelected = selectedRoom === roomKey;
              return (
                <TouchableOpacity
                  key={roomKey}
                  style={[
                    styles.tab,
                    isSelected && { borderColor: room.color, backgroundColor: room.color + '20' }
                  ]}
                  onPress={() => setSelectedRoom(roomKey)}
                >
                  <Text style={[
                    styles.tabText,
                    isSelected && { color: room.color }
                  ]}>
                    {room.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Room Description */}
          <View style={[styles.roomDescription, { borderLeftColor: currentRoom.color }]}>
            <Text style={styles.roomDescriptionText}>{currentRoom.description}</Text>
          </View>
        </View>

        {/* Package Selection */}
        <View style={styles.section}>
          {currentRoom.packages.map(pkg => (
            <TouchableOpacity
              key={pkg.value}
              style={[
                styles.packageCard,
                selectedPackage === pkg.value && { borderColor: currentRoom.color, backgroundColor: currentRoom.color + '10' }
              ]}
              onPress={() => setSelectedPackage(pkg.value)}
            >
              <View style={styles.packageHeader}>
                <View>
                  <Text style={[
                    styles.packageName,
                    selectedPackage === pkg.value && { color: currentRoom.color }
                  ]}>
                    {pkg.label}
                  </Text>
                  <Text style={styles.packageCapacity}>{pkg.capacity}</Text>
                </View>
                <Text style={[styles.packagePrice, { color: currentRoom.color }]}>{pkg.price}€</Text>
              </View>
              <View style={styles.packageFeatures}>
                {pkg.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Guest Count */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Nombre de personnes</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="people" size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Ex: 6"
              placeholderTextColor={theme.colors.textMuted}
              value={guestCount}
              onChangeText={setGuestCount}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Bottle Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍸 Préférences bouteilles (optionnel)</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: Vodka Grey Goose, Champagne Moët..."
              placeholderTextColor={theme.colors.textMuted}
              value={bottlePreferences}
              onChangeText={setBottlePreferences}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Special Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Demandes spéciales (optionnel)</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Anniversaire, demande particulière..."
              placeholderTextColor={theme.colors.textMuted}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Informations de contact</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              placeholderTextColor={theme.colors.textMuted}
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.textMuted}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="call" size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              placeholderTextColor={theme.colors.textMuted}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Summary */}
        {packageDetails && (
          <View style={[styles.summaryCard, { borderLeftColor: currentRoom.color }]}>
            <Text style={styles.summaryTitle}>📋 Résumé de votre réservation</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Salle:</Text>
              <Text style={[styles.summaryValue, { color: currentRoom.color }]}>{currentRoom.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Formule:</Text>
              <Text style={styles.summaryValue}>{packageDetails.label}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Capacité:</Text>
              <Text style={styles.summaryValue}>{packageDetails.capacity}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Prix:</Text>
              <Text style={[styles.summaryPrice, { color: currentRoom.color }]}>{packageDetails.price}€</Text>
            </View>
            <Text style={styles.summaryNote}>
              💡 La confirmation et le paiement se feront après validation de votre demande
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: currentRoom.color }, loading && styles.submitButtonDisabled]}
          onPress={handleSubmitBooking}
          disabled={loading}
        >
          <Ionicons name="send" size={20} color="white" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Notre équipe vous contactera sous 24h pour confirmer votre réservation et organiser le paiement.
          </Text>
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

  // Section
  section: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },

  // Picker
  pickerContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    color: theme.colors.textPrimary,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 90,
  },
  tabText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
  },

  // Room Description
  roomDescription: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
  },
  roomDescriptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  // Package Card
  packageCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  packageName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  packageCapacity: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  packagePrice: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
  },
  packageFeatures: {
    gap: theme.spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  textAreaContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  textArea: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Summary
  summaryCard: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
  },
  summaryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  summaryPrice: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
  },
  summaryNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
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
});
