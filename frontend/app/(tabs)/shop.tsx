import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/config/api';

interface Event {
  id: string;
  name: string;
  event_date: string;
}

const VIP_ZONES = [
  { value: 'main_floor', label: 'Main Floor VIP', icon: 'star' },
  { value: 'vip_area', label: 'VIP Area Premium', icon: 'diamond' },
  { value: 'terrace', label: 'Terrasse Exclusive', icon: 'snow' },
];

const VIP_PACKAGES = [
  {
    value: 'bronze',
    label: 'Bronze',
    price: 200,
    features: ['Table pour 4-6 personnes', '1 bouteille incluse', 'Service standard'],
  },
  {
    value: 'silver',
    label: 'Silver',
    price: 350,
    features: ['Table pour 6-8 personnes', '2 bouteilles incluses', 'Service prioritaire', 'Mixers premium'],
  },
  {
    value: 'gold',
    label: 'Gold',
    price: 500,
    features: ['Table pour 8-10 personnes', '3 bouteilles premium', 'Service VIP dédié', 'Champagne offert', 'Entrée prioritaire'],
  },
];

export default function VIPBookingScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedZone, setSelectedZone] = useState('main_floor');
  const [selectedPackage, setSelectedPackage] = useState('bronze');
  const [guestCount, setGuestCount] = useState('6');
  const [bottlePreferences, setBottlePreferences] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

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

  const getSelectedPackageDetails = () => {
    return VIP_PACKAGES.find(p => p.value === selectedPackage);
  };

  const handleSubmitBooking = async () => {
    if (!selectedEvent) {
      Alert.alert('Erreur', 'Veuillez sélectionner un événement');
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir votre nom et email');
      return;
    }

    const packageDetails = getSelectedPackageDetails();
    if (!packageDetails) return;

    try {
      setLoading(true);

      const bookingData = {
        event_id: selectedEvent,
        zone: selectedZone,
        package: selectedPackage,
        guest_count: parseInt(guestCount),
        bottle_preferences: bottlePreferences.trim(),
        special_requests: specialRequests.trim(),
        total_price: packageDetails.price,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
      };

      const response = await api.post('/vip/book', bookingData);

      Alert.alert(
        'Demande envoyée! 🍾',
        'Votre demande de réservation VIP a été reçue. Nous vous contacterons sous 24h pour confirmer.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
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

  const packageDetails = getSelectedPackageDetails();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🍾 Tables VIP</Text>
          <Text style={styles.subtitle}>Réserve ta table pour une soirée inoubliable</Text>
        </View>

        {/* Event Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Événement</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedEvent}
              onValueChange={setSelectedEvent}
              style={styles.picker}
            >
              {events.map(event => (
                <Picker.Item
                  key={event.id}
                  label={`${event.name} - ${new Date(event.event_date).toLocaleDateString('fr-FR')}`}
                  value={event.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Zone Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zone VIP</Text>
          <View style={styles.optionsGrid}>
            {VIP_ZONES.map(zone => (
              <TouchableOpacity
                key={zone.value}
                style={[
                  styles.optionCard,
                  selectedZone === zone.value && styles.optionCardSelected
                ]}
                onPress={() => setSelectedZone(zone.value)}
              >
                <Ionicons
                  name={zone.icon as any}
                  size={32}
                  color={selectedZone === zone.value ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text style={[
                  styles.optionLabel,
                  selectedZone === zone.value && styles.optionLabelSelected
                ]}>
                  {zone.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Package Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package VIP</Text>
          {VIP_PACKAGES.map(pkg => (
            <TouchableOpacity
              key={pkg.value}
              style={[
                styles.packageCard,
                selectedPackage === pkg.value && styles.packageCardSelected
              ]}
              onPress={() => setSelectedPackage(pkg.value)}
            >
              <View style={styles.packageHeader}>
                <Text style={[
                  styles.packageName,
                  selectedPackage === pkg.value && styles.packageNameSelected
                ]}>
                  {pkg.label}
                </Text>
                <Text style={styles.packagePrice}>{pkg.price}€</Text>
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
          <Text style={styles.sectionTitle}>Nombre de personnes</Text>
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
          <Text style={styles.sectionTitle}>Préférences bouteilles (optionnel)</Text>
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
          <Text style={styles.sectionTitle}>Demandes spéciales (optionnel)</Text>
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
          <Text style={styles.sectionTitle}>Informations de contact</Text>
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
        </View>

        {/* Summary */}
        {packageDetails && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Résumé de votre réservation</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Package:</Text>
              <Text style={styles.summaryValue}>{packageDetails.label}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Prix:</Text>
              <Text style={styles.summaryPrice}>{packageDetails.price}€</Text>
            </View>
            <Text style={styles.summaryNote}>
              💡 La confirmation et le paiement se feront après validation de votre demande
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmitBooking}
          disabled={loading}
        >
          <Ionicons name="send" size={20} color="white" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Envoi...' : 'Envoyer la demande'}
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

  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  optionCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  optionLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
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
  packageCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  packageName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  packageNameSelected: {
    color: theme.colors.primary,
  },
  packagePrice: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.neonPink,
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
    borderLeftColor: theme.colors.primary,
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.neonPink,
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
    backgroundColor: theme.colors.primary,
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
