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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import api from '../../src/config/api';
import { LoginRequiredModal } from '../../src/components/LoginRequiredModal';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  name: string;
  event_date: string;
  banner_image?: string;
}

type RoomKey = 'main_room' | 'classy_room' | 'vip';

export default function VIPBookingScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Room types with their packages - using translation keys
  const getRooms = () => ({
    main_room: {
      name: t('mainRoom'),
      icon: 'musical-notes',
      color: theme.colors.primary,
      description: t('mainRoomDesc'),
      packages: [
        {
          value: 'table_haute',
          label: t('tableHaute'),
          price: 300,
          capacity: '4-6 ' + t('people'),
          features: [t('standingTable'), t('danceFloorView')],
        },
        {
          value: 'table_assise',
          label: t('tableAssise'),
          price: 500,
          capacity: '6-8 ' + t('people'),
          features: [t('seatedTable'), t('danceFloorView')],
        },
        {
          value: 'table_premium',
          label: t('tablePremium'),
          price: 750,
          capacity: '8-10 ' + t('people'),
          features: [t('bestLocation'), t('largerSpace')],
        },
      ],
    },
    classy_room: {
      name: t('classyRoom'),
      icon: 'wine',
      color: '#FFD700',
      description: t('classyRoomDesc'),
      packages: [
        {
          value: 'table_haute',
          label: t('tableHaute'),
          price: 300,
          capacity: '4-6 ' + t('people'),
          features: [t('standingTable')],
        },
        {
          value: 'table_assise',
          label: t('tableAssise'),
          price: 500,
          capacity: '6-8 ' + t('people'),
          features: [t('seatedTable')],
        },
        {
          value: 'table_premium',
          label: t('tablePremium'),
          price: 750,
          capacity: '8-10 ' + t('people'),
          features: [t('privatifSpace'), t('largerSpace')],
        },
      ],
    },
    vip: {
      name: t('vipRoom'),
      icon: 'diamond',
      color: '#E91E63',
      description: t('vipRoomDesc'),
      packages: [
        {
          value: 'table_haute',
          label: t('tableHaute') + ' VIP',
          price: 500,
          capacity: '4-6 ' + t('people'),
          features: [t('tablePremium'), t('vipSpaceAccess'), t('priorityEntry')],
        },
        {
          value: 'table_assise',
          label: t('tableAssise') + ' VIP',
          price: 1000,
          capacity: '8-10 ' + t('people'),
          features: [t('luxuryTable'), t('vipDedicatedService'), t('priorityEntry')],
        },
        {
          value: 'table_presidentiel',
          label: t('tablePresidentielle'),
          price: 1500,
          capacity: '10-15 ' + t('people'),
          features: [t('privateExclusive'), t('butlerService'), t('priorityEntry')],
        },
      ],
    },
  });

  const ROOMS = getRooms();

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
      console.log('Events loaded:', response.data);
      // Take all events, not just upcoming ones
      const allEvents = response.data;
      setEvents(allEvents);
      if (allEvents.length > 0) {
        setSelectedEvent(allEvents[0].id);
        console.log('Selected event:', allEvents[0].id);
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
    console.log('handleSubmitBooking called');
    console.log('selectedEvent:', selectedEvent);
    console.log('customerName:', customerName);
    
    if (!selectedEvent) {
      Alert.alert(t('error'), t('noEventAvailable'));
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      Alert.alert(t('error'), t('fillContactFields'));
      return;
    }

    const packageDetails = getSelectedPackageDetails();
    if (!packageDetails) {
      Alert.alert(t('error'), t('selectTable'));
      return;
    }

    try {
      setLoading(true);
      console.log('Sending booking request...');

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

      console.log('Booking data:', bookingData);
      const response = await api.post('/vip/book', bookingData);
      console.log('Booking response:', response.data);

      // Show success modal
      setShowSuccessModal(true);
      
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setBottlePreferences('');
      setSpecialRequests('');
      setGuestCount('6');
      
    } catch (error: any) {
      console.error('Booking error:', error);
      const message = error.response?.data?.detail || t('bookingError');
      Alert.alert(t('error'), message);
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
          <Text style={styles.sectionTitle}>{t('numberOfPeople')}</Text>
          <View style={styles.inputContainer}>
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
          <Text style={styles.sectionTitle}>{t('bottlePreferencesOptional')}</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder={t('bottlePreferencesPlaceholder')}
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
          <Text style={styles.sectionTitle}>{t('specialRequestsOptional')}</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder={t('specialRequestsPlaceholder')}
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
          <Text style={styles.sectionTitle}>{t('contactInfo')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputNoIcon}
              placeholder={t('fullName')}
              placeholderTextColor={theme.colors.textMuted}
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputNoIcon}
              placeholder={t('email')}
              placeholderTextColor={theme.colors.textMuted}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputNoIcon}
              placeholder={t('phoneNumber')}
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
            <Text style={styles.summaryTitle}>📋 {t('bookingSummary')}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('room')}:</Text>
              <Text style={[styles.summaryValue, { color: currentRoom.color }]}>{currentRoom.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('table')}:</Text>
              <Text style={styles.summaryValue}>{packageDetails.label}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('capacity')}:</Text>
              <Text style={styles.summaryValue}>{packageDetails.capacity}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('price')}:</Text>
              <Text style={[styles.summaryPrice, { color: currentRoom.color }]}>{packageDetails.price}€</Text>
            </View>
            <Text style={styles.summaryNote}>
              💡 {t('paymentNote')}
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
            {loading ? t('sending') : t('sendRequest')}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            {t('contactWithin24h')}
          </Text>
        </View>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
            </View>
            <Text style={styles.modalTitle}>{t('requestSent')} 🍾</Text>
            <Text style={styles.modalMessage}>
              {t('requestSuccessMessage')}
            </Text>
            <Text style={styles.modalSubMessage}>
              {t('contactWithin24h')}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>{t('great')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // Event Flyer
  flyerSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  flyerImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
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
  inputNoIcon: {
    flex: 1,
    paddingVertical: theme.spacing.md,
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

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalSubMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
});
