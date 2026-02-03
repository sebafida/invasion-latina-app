import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/config/api';

type TabType = 'events' | 'photos' | 'aftermovies' | 'flyer';

interface Event {
  id: string;
  name: string;
  event_date: string;
  status: string;
}

interface Photo {
  id: string;
  url: string;
  event_id: string;
}

interface Aftermovie {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
}

export default function ContentManagerScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('flyer');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [aftermovies, setAftermovies] = useState<Aftermovie[]>([]);
  
  // Form states
  const [flyerUrl, setFlyerUrl] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [newAftermovieName, setNewAftermovieName] = useState('');
  const [newAftermovieUrl, setNewAftermovieUrl] = useState('');
  const [newAftermovieThumb, setNewAftermovieThumb] = useState('');

  // Check admin access
  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Accès refusé', 'Cette page est réservée aux administrateurs');
      router.back();
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load events
      const eventsRes = await api.get('/events');
      setEvents(eventsRes.data);
      if (eventsRes.data.length > 0) {
        setSelectedEventId(eventsRes.data[0].id);
      }

      // Load aftermovies
      const aftermoviesRes = await api.get('/media/aftermovies');
      setAftermovies(aftermoviesRes.data);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une URL de photo');
      return;
    }

    if (!selectedEventId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un événement');
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/media/photos', {
        url: newPhotoUrl,
        event_id: selectedEventId,
      });
      Alert.alert('Succès', 'Photo ajoutée avec succès!');
      setNewPhotoUrl('');
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la photo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAftermovie = async () => {
    if (!newAftermovieName.trim() || !newAftermovieUrl.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/media/aftermovies', {
        title: newAftermovieName,
        video_url: newAftermovieUrl,
        thumbnail_url: newAftermovieThumb || 'https://via.placeholder.com/400x225',
        event_date: new Date().toISOString(),
      });
      Alert.alert('Succès', 'Aftermovie ajouté avec succès!');
      setNewAftermovieName('');
      setNewAftermovieUrl('');
      setNewAftermovieThumb('');
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'aftermovie');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFlyer = async () => {
    if (!flyerUrl.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une URL de flyer');
      return;
    }

    if (!selectedEventId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un événement');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/admin/events/${selectedEventId}/flyer`, {
        banner_image: flyerUrl,
      });
      Alert.alert('Succès', 'Flyer mis à jour avec succès!');
      setFlyerUrl('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le flyer');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'flyer', label: 'Flyer', icon: 'image' },
    { key: 'photos', label: 'Photos', icon: 'images' },
    { key: 'aftermovies', label: 'Aftermovies', icon: 'videocam' },
    { key: 'events', label: 'Events', icon: 'calendar' },
  ];

  const renderFlyerTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📸 Modifier le Flyer de l'événement</Text>
      <Text style={styles.helpText}>
        Le flyer apparaîtra sur la page d'accueil et la page Tickets
      </Text>

      {/* Event Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Événement</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventSelector}>
          {events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventChip,
                selectedEventId === event.id && styles.eventChipSelected
              ]}
              onPress={() => setSelectedEventId(event.id)}
            >
              <Text style={[
                styles.eventChipText,
                selectedEventId === event.id && styles.eventChipTextSelected
              ]}>
                {event.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Flyer URL Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>URL du Flyer (image)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://exemple.com/flyer.jpg"
          placeholderTextColor={theme.colors.textMuted}
          value={flyerUrl}
          onChangeText={setFlyerUrl}
          autoCapitalize="none"
        />
      </View>

      {/* Preview */}
      {flyerUrl ? (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Aperçu:</Text>
          <Image
            source={{ uri: flyerUrl }}
            style={styles.flyerPreview}
            resizeMode="contain"
          />
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleUpdateFlyer}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="cloud-upload" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Mettre à jour le Flyer</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          💡 Astuce: Uploadez votre image sur un service comme Imgur, Google Drive (lien public), ou Cloudinary, puis collez l'URL ici.
        </Text>
      </View>
    </View>
  );

  const renderPhotosTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📷 Ajouter des Photos</Text>
      <Text style={styles.helpText}>
        Ajoutez des photos de vos événements pour la galerie
      </Text>

      {/* Event Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Événement</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventSelector}>
          {events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventChip,
                selectedEventId === event.id && styles.eventChipSelected
              ]}
              onPress={() => setSelectedEventId(event.id)}
            >
              <Text style={[
                styles.eventChipText,
                selectedEventId === event.id && styles.eventChipTextSelected
              ]}>
                {event.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Photo URL Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>URL de la Photo</Text>
        <TextInput
          style={styles.input}
          placeholder="https://exemple.com/photo.jpg"
          placeholderTextColor={theme.colors.textMuted}
          value={newPhotoUrl}
          onChangeText={setNewPhotoUrl}
          autoCapitalize="none"
        />
      </View>

      {/* Preview */}
      {newPhotoUrl ? (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Aperçu:</Text>
          <Image
            source={{ uri: newPhotoUrl }}
            style={styles.photoPreview}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAddPhoto}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Ajouter la Photo</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="bulb" size={20} color={theme.colors.secondary} />
        <Text style={styles.infoText}>
          Pour ajouter plusieurs photos, répétez l'opération pour chaque URL.
        </Text>
      </View>
    </View>
  );

  const renderAftermoviesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🎬 Ajouter un Aftermovie</Text>
      <Text style={styles.helpText}>
        Ajoutez des vidéos récapitulatives de vos événements
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Titre de l'Aftermovie</Text>
        <TextInput
          style={styles.input}
          placeholder="Invasion Latina - Amazonia Edition"
          placeholderTextColor={theme.colors.textMuted}
          value={newAftermovieName}
          onChangeText={setNewAftermovieName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>URL de la Vidéo (YouTube, Vimeo, etc.)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://youtube.com/watch?v=xxxxx"
          placeholderTextColor={theme.colors.textMuted}
          value={newAftermovieUrl}
          onChangeText={setNewAftermovieUrl}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>URL de la Miniature (optionnel)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://exemple.com/thumbnail.jpg"
          placeholderTextColor={theme.colors.textMuted}
          value={newAftermovieThumb}
          onChangeText={setNewAftermovieThumb}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAddAftermovie}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="videocam" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Ajouter l'Aftermovie</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Existing Aftermovies */}
      {aftermovies.length > 0 && (
        <View style={styles.existingSection}>
          <Text style={styles.existingSectionTitle}>Aftermovies existants</Text>
          {aftermovies.map((video) => (
            <View key={video.id} style={styles.existingItem}>
              <Ionicons name="play-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.existingItemText}>{video.title}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderEventsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📅 Événements</Text>
      <Text style={styles.helpText}>
        Liste des événements existants
      </Text>

      {events.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventCardHeader}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            <View style={styles.eventCardInfo}>
              <Text style={styles.eventCardName}>{event.name}</Text>
              <Text style={styles.eventCardDate}>
                {new Date(event.event_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              event.status === 'upcoming' && styles.statusUpcoming,
              event.status === 'live' && styles.statusLive,
            ]}>
              <Text style={styles.statusText}>{event.status}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          Pour créer un nouvel événement ou modifier les détails, contactez le support technique.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion du Contenu</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'flyer' && renderFlyerTab()}
        {activeTab === 'photos' && renderPhotosTab()}
        {activeTab === 'aftermovies' && renderAftermoviesTab()}
        {activeTab === 'events' && renderEventsTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevated,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.primary + '20',
  },
  tabLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },

  // Content
  content: {
    flex: 1,
  },
  tabContent: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  helpText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },

  // Input Group
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.elevated,
  },

  // Event Selector
  eventSelector: {
    flexDirection: 'row',
  },
  eventChip: {
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.elevated,
  },
  eventChipSelected: {
    backgroundColor: theme.colors.primary + '30',
    borderColor: theme.colors.primary,
  },
  eventChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  eventChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },

  // Preview
  previewContainer: {
    marginBottom: theme.spacing.lg,
  },
  previewLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  flyerPreview: {
    width: '100%',
    height: 300,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.cardBackground,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.cardBackground,
  },

  // Button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Existing Section
  existingSection: {
    marginTop: theme.spacing.lg,
  },
  existingSectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  existingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  existingItemText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
  },

  // Event Card
  eventCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  eventCardDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.textMuted,
  },
  statusUpcoming: {
    backgroundColor: theme.colors.primary + '30',
  },
  statusLive: {
    backgroundColor: theme.colors.success + '30',
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
  },
});
