import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';

interface DJ {
  id: string;
  name: string;
  type?: 'dj' | 'mc';
  bio?: string;
  photo_url?: string;
  instagram_url?: string;
  is_resident: boolean;
  selected?: boolean;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
  selected_djs?: string[];
}

// DJ Photos
const DJ_PHOTOS: { [key: string]: any } = {
  'DJ GIZMO': require('../../assets/images/dj-gizmo.png'),
  'DJ DNK': require('../../assets/images/dj-dnk.png'),
  'DJ CRUZ': require('../../assets/images/dj-cruz.png'),
  'DJ DANIEL MURILLO': require('../../assets/images/dj-daniel-murillo.png'),
  'DJ SUNCEE': require('../../assets/images/dj-suncee.png'),
  'DJ SAMO': require('../../assets/images/dj-samo.png'),
  'DJ MABOY': require('../../assets/images/dj-maboy.png'),
  'MC VELASQUEZ': require('../../assets/images/mc-velasquez.png'),
};

export default function DJSelectionScreen() {
  const router = useRouter();
  const [djs, setDjs] = useState<DJ[]>([]);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [selectedDjIds, setSelectedDjIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load DJs
      const djsResponse = await api.get('/djs');
      setDjs(djsResponse.data);
      
      // Load next event
      const eventResponse = await api.get('/events/next');
      if (eventResponse.data?.event) {
        setNextEvent(eventResponse.data.event);
        setSelectedDjIds(eventResponse.data.event.selected_djs || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const toggleDjSelection = (djId: string) => {
    setSelectedDjIds(prev => 
      prev.includes(djId) 
        ? prev.filter(id => id !== djId)
        : [...prev, djId]
    );
  };

  const handleSaveSelection = async () => {
    if (!nextEvent) {
      Alert.alert('Erreur', 'Aucun événement trouvé');
      return;
    }

    try {
      setSaving(true);
      await api.put(`/admin/events/${nextEvent.id}/djs`, {
        selected_djs: selectedDjIds
      });
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      Alert.alert(
        '✅ Succès !',
        `${selectedDjIds.length} DJ(s) sélectionné(s) pour ${nextEvent.name}.\n\nLe LineUp de la page d'accueil a été mis à jour.`,
        [{ text: 'Super !', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Error saving selection:', error);
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-BE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Filter DJs vs MCs - check by name prefix or bio content
  const residentDjs = djs.filter(dj => !dj.name.startsWith('MC ') && !dj.bio?.includes('MC'));
  const mcs = djs.filter(dj => dj.name.startsWith('MC ') || dj.bio?.includes('MC'));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Success Banner */}
      {showSuccessMessage && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.successBannerText}>Sélection enregistrée !</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sélection DJs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Event Info */}
        {nextEvent && (
          <View style={styles.eventCard}>
            <Text style={styles.eventLabel}>Prochain événement</Text>
            <Text style={styles.eventName}>{nextEvent.name}</Text>
            <Text style={styles.eventDate}>{formatDate(nextEvent.event_date)}</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.instructionText}>
            Sélectionne les DJs qui seront présents au prochain event. Les DJs sélectionnés seront affichés dans l'app.
          </Text>
        </View>

        {/* DJs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DJs Résidents</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedDjIds.filter(id => residentDjs.some(dj => dj.id === id)).length} sélectionné(s)
          </Text>
          
          <View style={styles.djGrid}>
            {residentDjs.map((dj) => {
              const isSelected = selectedDjIds.includes(dj.id);
              const localPhoto = DJ_PHOTOS[dj.name];
              
              return (
                <TouchableOpacity
                  key={dj.id}
                  style={[styles.djCard, isSelected && styles.djCardSelected]}
                  onPress={() => toggleDjSelection(dj.id)}
                >
                  {/* Selection indicator */}
                  <View style={[styles.selectionBadge, isSelected && styles.selectionBadgeActive]}>
                    <Ionicons 
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={isSelected ? theme.colors.success : theme.colors.textMuted} 
                    />
                  </View>
                  
                  {/* Photo */}
                  <View style={styles.djPhotoContainer}>
                    {localPhoto ? (
                      <Image
                        source={localPhoto}
                        style={styles.djPhoto}
                        resizeMode="cover"
                      />
                    ) : dj.photo_url ? (
                      <Image
                        source={{ uri: dj.photo_url }}
                        style={styles.djPhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.djPlaceholder}>
                        <Ionicons name="disc" size={32} color={theme.colors.primary} />
                      </View>
                    )}
                  </View>
                  
                  {/* Name */}
                  <Text style={[styles.djName, isSelected && styles.djNameSelected]}>
                    {dj.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* MCs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MCs</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedDjIds.filter(id => mcs.some(mc => mc.id === id)).length} sélectionné(s)
          </Text>
          
          <View style={styles.djGrid}>
            {mcs.map((mc) => {
              const isSelected = selectedDjIds.includes(mc.id);
              const localPhoto = DJ_PHOTOS[mc.name];
              
              return (
                <TouchableOpacity
                  key={mc.id}
                  style={[styles.djCard, isSelected && styles.djCardSelected]}
                  onPress={() => toggleDjSelection(mc.id)}
                >
                  {/* Selection indicator */}
                  <View style={[styles.selectionBadge, isSelected && styles.selectionBadgeActive]}>
                    <Ionicons 
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={isSelected ? theme.colors.success : theme.colors.textMuted} 
                    />
                  </View>
                  
                  {/* Photo */}
                  <View style={styles.djPhotoContainer}>
                    {localPhoto ? (
                      <Image
                        source={localPhoto}
                        style={styles.djPhoto}
                        resizeMode="cover"
                      />
                    ) : mc.photo_url ? (
                      <Image
                        source={{ uri: mc.photo_url }}
                        style={styles.djPhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.djPlaceholder}>
                        <Ionicons name="mic" size={32} color={theme.colors.secondary} />
                      </View>
                    )}
                  </View>
                  
                  {/* Name */}
                  <Text style={[styles.djName, isSelected && styles.djNameSelected]}>
                    {mc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveSelection}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.saveButtonText}>Enregistrer la sélection</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  successBannerText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevated,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  eventCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  eventLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  eventName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  eventDate: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  instructionText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  djGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  djCard: {
    width: '30%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  djCardSelected: {
    borderColor: theme.colors.success,
    backgroundColor: `${theme.colors.success}15`,
  },
  selectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  selectionBadgeActive: {
    // Active state styles if needed
  },
  djPhotoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.elevated,
  },
  djPhoto: {
    width: '100%',
    height: '100%',
  },
  djPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  djName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: theme.fontWeight.medium,
  },
  djNameSelected: {
    color: theme.colors.success,
    fontWeight: theme.fontWeight.bold,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
