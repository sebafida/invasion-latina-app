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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/config/api';

type TabType = 'events' | 'photos' | 'aftermovies' | 'flyer';

interface Event {
  id: string;
  name: string;
  event_date: string;
  description?: string;
  venue_name?: string;
  xceed_ticket_url?: string;
  banner_image?: string;
  status: string;
  gallery_visible?: boolean;
  aftermovie_visible?: boolean;
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
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [aftermovies, setAftermovies] = useState<Aftermovie[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  
  // Form states
  const [flyerUrl, setFlyerUrl] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [newAftermovieName, setNewAftermovieName] = useState('');
  const [newAftermovieUrl, setNewAftermovieUrl] = useState('');
  const [newAftermovieThumb, setNewAftermovieThumb] = useState('');
  
  // Event form states
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventVenue, setEventVenue] = useState('Mirano Continental');
  const [eventXceedUrl, setEventXceedUrl] = useState('');
  const [eventBannerUrl, setEventBannerUrl] = useState('');

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      Alert.alert('Accès refusé', 'Cette page est réservée aux administrateurs');
      router.replace('/(tabs)/home');
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

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

  const handleCreateEvent = async () => {
    if (!eventName.trim() || !eventDate.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et la date de l\'événement');
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/events', {
        name: eventName,
        event_date: new Date(eventDate).toISOString(),
        description: eventDescription,
        venue_name: eventVenue,
        xceed_ticket_url: eventXceedUrl,
        banner_image: eventBannerUrl,
      });
      Alert.alert('Succès', 'Événement créé avec succès!');
      resetEventForm();
      setShowEventForm(false);
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'événement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventName.trim() || !eventDate.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et la date de l\'événement');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/admin/events/${editingEvent.id}`, {
        name: eventName,
        event_date: new Date(eventDate).toISOString(),
        description: eventDescription,
        venue_name: eventVenue,
        xceed_ticket_url: eventXceedUrl,
        banner_image: eventBannerUrl,
      });
      Alert.alert('Succès', 'Événement mis à jour avec succès!');
      resetEventForm();
      setEditingEvent(null);
      setShowEventForm(false);
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'événement');
    } finally {
      setLoading(false);
    }
  };

  const resetEventForm = () => {
    setEventName('');
    setEventDate('');
    setEventDescription('');
    setEventVenue('Mirano Continental');
    setEventXceedUrl('');
    setEventBannerUrl('');
  };

  const startEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventName(event.name);
    setEventDate(event.event_date.split('T')[0]); // Format YYYY-MM-DD
    setEventDescription(event.description || '');
    setEventVenue(event.venue_name || 'Mirano Continental');
    setEventXceedUrl(event.xceed_ticket_url || '');
    setEventBannerUrl(event.banner_image || '');
    setShowEventForm(true);
  };

  const handleToggleVisibility = async (eventId: string, field: 'gallery_visible' | 'aftermovie_visible', currentValue: boolean) => {
    try {
      await api.put(`/admin/events/${eventId}/visibility`, {
        [field]: !currentValue
      });
      // Refresh events list
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier la visibilité');
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
          💡 Le flyer de l'événement sera utilisé comme couverture d'album dans les sections Photos et Aftermovies.
        </Text>
      </View>

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
        Créez et modifiez vos événements
      </Text>

      {/* Add/Edit Event Form */}
      {showEventForm ? (
        <View style={styles.eventForm}>
          <Text style={styles.formTitle}>
            {editingEvent ? '✏️ Modifier l\'événement' : '➕ Nouvel événement'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom de l'événement *</Text>
            <TextInput
              style={styles.input}
              placeholder="Invasion Latina - Edition XXX"
              placeholderTextColor={theme.colors.textMuted}
              value={eventName}
              onChangeText={setEventName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date de l'événement * (AAAA-MM-JJ)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-03-15"
              placeholderTextColor={theme.colors.textMuted}
              value={eventDate}
              onChangeText={setEventDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="La plus grande soirée latino..."
              placeholderTextColor={theme.colors.textMuted}
              value={eventDescription}
              onChangeText={setEventDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lieu</Text>
            <TextInput
              style={styles.input}
              placeholder="Mirano Continental"
              placeholderTextColor={theme.colors.textMuted}
              value={eventVenue}
              onChangeText={setEventVenue}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lien XCEED (billetterie)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://xceed.me/..."
              placeholderTextColor={theme.colors.textMuted}
              value={eventXceedUrl}
              onChangeText={setEventXceedUrl}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>URL du Flyer</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={theme.colors.textMuted}
              value={eventBannerUrl}
              onChangeText={setEventBannerUrl}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                resetEventForm();
                setEditingEvent(null);
                setShowEventForm(false);
              }}
            >
              <Text style={styles.secondaryButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={editingEvent ? handleUpdateEvent : handleCreateEvent}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {editingEvent ? 'Mettre à jour' : 'Créer'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addEventButton}
          onPress={() => setShowEventForm(true)}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addEventButtonText}>Créer un nouvel événement</Text>
        </TouchableOpacity>
      )}

      {/* Existing Events */}
      <Text style={styles.existingSectionTitle}>Événements existants</Text>
      {events.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <TouchableOpacity 
            style={styles.eventCardHeader}
            onPress={() => startEditEvent(event)}
          >
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
            <Ionicons name="create-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Visibility Toggles */}
          <View style={styles.visibilitySection}>
            <TouchableOpacity 
              style={[
                styles.visibilityToggle,
                event.gallery_visible && styles.visibilityToggleActive
              ]}
              onPress={() => handleToggleVisibility(event.id, 'gallery_visible', event.gallery_visible || false)}
            >
              <Ionicons 
                name={event.gallery_visible ? "eye" : "eye-off"} 
                size={16} 
                color={event.gallery_visible ? theme.colors.success : theme.colors.textMuted} 
              />
              <Text style={[
                styles.visibilityToggleText,
                event.gallery_visible && styles.visibilityToggleTextActive
              ]}>
                📸 Photos {event.gallery_visible ? 'visibles' : 'masquées'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.visibilityToggle,
                event.aftermovie_visible && styles.visibilityToggleActive
              ]}
              onPress={() => handleToggleVisibility(event.id, 'aftermovie_visible', event.aftermovie_visible || false)}
            >
              <Ionicons 
                name={event.aftermovie_visible ? "eye" : "eye-off"} 
                size={16} 
                color={event.aftermovie_visible ? theme.colors.success : theme.colors.textMuted} 
              />
              <Text style={[
                styles.visibilityToggleText,
                event.aftermovie_visible && styles.visibilityToggleTextActive
              ]}>
                🎬 Aftermovie {event.aftermovie_visible ? 'visible' : 'masqué'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          Appuyez sur un événement pour le modifier. La date doit être au format AAAA-MM-JJ (ex: 2025-03-15).
        </Text>
      </View>
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

  // Event Form
  eventForm: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  formTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  addEventButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },

  // Visibility Toggles
  visibilitySection: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.elevated,
  },
  visibilityToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.elevated,
  },
  visibilityToggleActive: {
    backgroundColor: theme.colors.success + '20',
  },
  visibilityToggleText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  visibilityToggleTextActive: {
    color: theme.colors.success,
    fontWeight: theme.fontWeight.bold,
  },
});
