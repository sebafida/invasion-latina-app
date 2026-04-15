import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/config/api';

type TabType = 'welcome' | 'events' | 'photos' | 'aftermovies' | 'flyer';

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
  gallery_url?: string;
  aftermovie_url?: string;
  visible_in_tickets?: boolean;
  is_featured?: boolean;
  event_type?: string;
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
  const [activeTab, setActiveTab] = useState<TabType>('welcome');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [aftermovies, setAftermovies] = useState<Aftermovie[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  
  // Welcome content states
  const [welcomeFlyerUrl, setWelcomeFlyerUrl] = useState('');
  const [welcomeTagline, setWelcomeTagline] = useState('');
  const [welcomeVenue, setWelcomeVenue] = useState('Mirano Continental, Brussels');
  
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
  const [eventTime, setEventTime] = useState('23:00');
  const [eventDescription, setEventDescription] = useState('');
  const [eventVenue, setEventVenue] = useState('Mirano Continental');
  const [eventXceedUrl, setEventXceedUrl] = useState('');
  const [eventBannerUrl, setEventBannerUrl] = useState('');
  const [eventTicketPrice, setEventTicketPrice] = useState('');


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

      // Load welcome content
      try {
        const welcomeRes = await api.get('/welcome-content');
        if (welcomeRes.data) {
          setWelcomeFlyerUrl(welcomeRes.data.flyer_url || '');
          setWelcomeTagline(welcomeRes.data.tagline || '');
          setWelcomeVenue(welcomeRes.data.venue_name || 'Mirano Continental, Brussels');
        }
      } catch (e) {
      }
      
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
      // Combine date and time
      const dateTimeString = `${eventDate}T${eventTime}:00`;
      await api.post('/admin/events', {
        name: eventName,
        event_date: new Date(dateTimeString).toISOString(),
        description: eventDescription,
        venue_name: eventVenue,
        xceed_ticket_url: eventXceedUrl,
        banner_image: eventBannerUrl,
        ticket_price: eventTicketPrice ? parseFloat(eventTicketPrice) : null,
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
      // Combine date and time
      const dateTimeString = `${eventDate}T${eventTime}:00`;
      await api.put(`/admin/events/${editingEvent.id}`, {
        name: eventName,
        event_date: new Date(dateTimeString).toISOString(),
        description: eventDescription,
        venue_name: eventVenue,
        xceed_ticket_url: eventXceedUrl,
        banner_image: eventBannerUrl,
        ticket_price: eventTicketPrice ? parseFloat(eventTicketPrice) : null,
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
    setEventTime('23:00');
    setEventDescription('');
    setEventVenue('Mirano Continental');
    setEventXceedUrl('');
    setEventBannerUrl('');
    setEventTicketPrice('');
  };

  const startEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventName(event.name);
    // Extract date and time from event_date with null safety
    if (event.event_date) {
      const dateTime = new Date(event.event_date);
      setEventDate(event.event_date.split('T')[0]); // Format YYYY-MM-DD
      const hours = dateTime.getHours().toString().padStart(2, '0');
      const minutes = dateTime.getMinutes().toString().padStart(2, '0');
      setEventTime(`${hours}:${minutes}`);
    } else {
      // Default values if event_date is null
      setEventDate(new Date().toISOString().split('T')[0]);
      setEventTime('23:00');
    }
    setEventDescription(event.description || '');
    setEventVenue(event.venue_name || 'Mirano Continental');
    setEventXceedUrl(event.xceed_ticket_url || '');
    setEventBannerUrl(event.banner_image || '');
    setShowEventForm(true);
  };

  const handleToggleVisibility = async (eventId: string, field: 'gallery_visible' | 'aftermovie_visible' | 'visible_in_tickets' | 'is_featured', currentValue: boolean) => {
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

  const handleChangeEventType = async (eventId: string, eventType: string) => {
    try {
      await api.put(`/admin/events/${eventId}/visibility`, {
        event_type: eventType
      });
      // Refresh events list
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le type d\'événement');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    Alert.alert(
      'Supprimer l\'événement',
      `Êtes-vous sûr de vouloir supprimer "${eventName}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/admin/events/${eventId}`);
              Alert.alert('Succès', 'Événement supprimé');
              loadData();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'événement');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Clear gallery function
  const handleClearGallery = (eventId: string, eventName: string) => {
    Alert.alert(
      'Vider la galerie',
      `Supprimer toutes les photos de "${eventName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/admin/gallery/${eventId}/clear`);
              Alert.alert('Succès', 'Galerie vidée');
              loadData();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de vider la galerie');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAftermovie = (aftermovieId: string) => {
    Alert.alert(
      'Supprimer l\'aftermovie',
      'Êtes-vous sûr de vouloir supprimer cet aftermovie ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/admin/aftermovies/${aftermovieId}`);
              Alert.alert('Succès', 'Aftermovie supprimé');
              loadData();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'aftermovie');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClearAllAftermovies = () => {
    Alert.alert(
      'Supprimer tous les aftermovies',
      'Êtes-vous sûr de vouloir supprimer TOUS les aftermovies ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete('/admin/aftermovies/clear-all');
              Alert.alert('Succès', 'Tous les aftermovies supprimés');
              loadData();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer les aftermovies');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Image picker functions - with Cloudinary upload
  const CLOUDINARY_CLOUD_NAME = 'dpj64f0zp';
  const CLOUDINARY_UPLOAD_PRESET = 'unsigned_preset';

  const uploadToCloudinary = async (uri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image. Veuillez réessayer.');
      return null;
    }
  };

  const pickEventFlyer = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16], // Portrait pour les flyers
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      const cloudinaryUrl = await uploadToCloudinary(result.assets[0].uri);
      setLoading(false);
      
      if (cloudinaryUrl) {
        setEventBannerUrl(cloudinaryUrl);
        Alert.alert('Succès', 'Image uploadée avec succès !');
      }
    }
  };

  const pickGalleryPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      const cloudinaryUrl = await uploadToCloudinary(result.assets[0].uri);
      setLoading(false);
      
      if (cloudinaryUrl) {
        setNewPhotoUrl(cloudinaryUrl);
        Alert.alert('Succès', 'Photo uploadée avec succès !');
      }
    }
  };

  // Sélection multiple de photos
  const pickMultiplePhotos = async () => {
    if (!selectedEventId) {
      Alert.alert('Erreur', 'Veuillez d\'abord sélectionner un événement');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      setLoading(true);
      let successCount = 0;
      let failCount = 0;

      for (const asset of result.assets) {
        try {
          const cloudinaryUrl = await uploadToCloudinary(asset.uri);
          if (cloudinaryUrl) {
            await api.post('/admin/media/photos', {
              url: cloudinaryUrl,
              event_id: selectedEventId,
            });
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      setLoading(false);
      
      if (successCount > 0) {
        Alert.alert(
          'Upload terminé', 
          `${successCount} photo(s) ajoutée(s) avec succès${failCount > 0 ? `, ${failCount} échec(s)` : ''}`
        );
        loadData();
      } else {
        Alert.alert('Erreur', 'Impossible d\'uploader les photos');
      }
    }
  };

  const pickWelcomeFlyer = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9], // Format paysage pour le flyer d'accueil
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      const cloudinaryUrl = await uploadToCloudinary(result.assets[0].uri);
      setLoading(false);
      
      if (cloudinaryUrl) {
        setWelcomeFlyerUrl(cloudinaryUrl);
        Alert.alert('Succès', 'Flyer uploadé avec succès !');
      }
    }
  };

  const handleSaveWelcomeContent = async () => {
    try {
      setLoading(true);
      await api.put('/admin/welcome-content', {
        flyer_url: welcomeFlyerUrl,
        tagline: welcomeTagline,
        venue_name: welcomeVenue,
      });
      Alert.alert('Succès', 'Contenu de la page d\'accueil mis à jour !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le contenu');
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
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le flyer');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'welcome', label: 'Accueil', icon: 'home' },
    { key: 'flyer', label: 'Flyer', icon: 'image' },
    { key: 'photos', label: 'Photos', icon: 'images' },
    { key: 'aftermovies', label: 'Aftermovies', icon: 'videocam' },
    { key: 'events', label: 'Events', icon: 'calendar' },
  ];

  // Render Welcome Tab (for the landing page flyer)
  const renderWelcomeTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🏠 Page d'accueil</Text>
      <Text style={styles.helpText}>
        Modifiez le flyer et les informations qui s'affichent sur la page d'accueil (avant connexion)
      </Text>

      {/* Upload Button */}
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => pickWelcomeFlyer()}
        disabled={loading}
      >
        <Ionicons name="cloud-upload" size={24} color={theme.colors.primary} />
        <Text style={styles.uploadButtonText}>
          {loading ? 'Upload en cours...' : 'Sélectionner le flyer (16:9)'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.orText}>ou entrez une URL :</Text>

      {/* Flyer URL Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>URL du Flyer</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={theme.colors.textMuted}
          value={welcomeFlyerUrl}
          onChangeText={setWelcomeFlyerUrl}
          autoCapitalize="none"
        />
      </View>

      {/* Preview */}
      {welcomeFlyerUrl ? (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Aperçu :</Text>
          <Image 
            source={{ uri: welcomeFlyerUrl }} 
            style={styles.welcomeFlyerPreview}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Tagline */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Slogan (sous le logo)</Text>
        <TextInput
          style={styles.input}
          placeholder="The Biggest Latino-Reggaeton Party in Belgium"
          placeholderTextColor={theme.colors.textMuted}
          value={welcomeTagline}
          onChangeText={setWelcomeTagline}
        />
      </View>

      {/* Venue */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Lieu</Text>
        <TextInput
          style={styles.input}
          placeholder="Mirano Continental, Brussels"
          placeholderTextColor={theme.colors.textMuted}
          value={welcomeVenue}
          onChangeText={setWelcomeVenue}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSaveWelcomeContent}
        disabled={loading}
      >
        <Ionicons name="save" size={20} color="white" />
        <Text style={styles.saveButtonText}>
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </Text>
      </TouchableOpacity>
    </View>
  );

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

      {/* Upload Button */}
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => pickEventFlyer()}
        disabled={loading}
      >
        <Ionicons name="cloud-upload" size={24} color={theme.colors.primary} />
        <Text style={styles.uploadButtonText}>
          {loading ? 'Upload en cours...' : 'Sélectionner un flyer (16:9)'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.orText}>ou entrez une URL :</Text>

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

  // Ref for scrollview
  const scrollViewRef = useRef<ScrollView>(null);

  // State for gallery photos
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Load gallery photos when event is selected
  const loadGalleryPhotos = async (eventId: string) => {
    if (!eventId) return;
    try {
      setLoadingPhotos(true);
      const response = await api.get(`/media/gallery/${eventId}`);
      setGalleryPhotos(response.data.photos || []);
    } catch (error) {
      console.error('Failed to load gallery photos:', error);
      setGalleryPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Delete individual photo
  const handleDeletePhoto = async (photoId: string) => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/admin/photos/${photoId}`);
              // Reload photos
              if (selectedEventId) {
                await loadGalleryPhotos(selectedEventId);
              }
              Alert.alert('Succès', 'Photo supprimée !');
            } catch (error) {
              console.error('Failed to delete photo:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la photo');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Effect to load photos when event changes
  useEffect(() => {
    if (selectedEventId) {
      loadGalleryPhotos(selectedEventId);
    }
  }, [selectedEventId]);

  const renderPhotosTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Lien Photos par evenement</Text>
      <Text style={styles.helpText}>
        Collez le lien de l'album Facebook pour chaque evenement. Activez "Photos visibles" dans l'onglet Events d'abord.
      </Text>

      {events.length === 0 ? (
        <View style={styles.noEventsWarning}>
          <Ionicons name="warning" size={20} color={theme.colors.warning} />
          <Text style={styles.noEventsText}>
            Aucun evenement disponible. Creez d'abord un evenement dans l'onglet "Events".
          </Text>
        </View>
      ) : (
        events.map((event) => (
          <View key={event.id} style={styles.linkEventCard}>
            <View style={styles.linkEventHeader}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
              <Text style={styles.linkEventName}>{event.name}</Text>
              <View style={[
                styles.linkStatusBadge,
                { backgroundColor: event.gallery_visible ? theme.colors.success + '20' : theme.colors.textMuted + '20' }
              ]}>
                <Text style={[
                  styles.linkStatusText,
                  { color: event.gallery_visible ? theme.colors.success : theme.colors.textMuted }
                ]}>
                  {event.gallery_visible ? 'Visible' : 'Masque'}
                </Text>
              </View>
            </View>
            <TextInput
              key={`gallery-${event.id}-${event.gallery_url || ''}`}
              style={styles.linkEventInput}
              defaultValue={event.gallery_url || ''}
              placeholder="https://www.facebook.com/media/set/?set=..."
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onEndEditing={(e) => {
                const url = e.nativeEvent.text.trim();
                if (url !== (event.gallery_url || '')) {
                  api.put(`/admin/events/${event.id}/visibility`, { gallery_url: url })
                    .then(() => { Alert.alert('Sauvegarde', 'Lien photos mis a jour'); loadData(); })
                    .catch(() => Alert.alert('Erreur', 'Impossible de sauvegarder le lien'));
                }
              }}
            />
            {!event.gallery_visible && (
              <TouchableOpacity
                style={styles.linkActivateButton}
                onPress={() => handleToggleVisibility(event.id, 'gallery_visible', false)}
              >
                <Ionicons name="eye" size={16} color={theme.colors.primary} />
                <Text style={styles.linkActivateText}>Activer Photos visibles</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderAftermoviesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Lien Aftermovie par evenement</Text>
      <Text style={styles.helpText}>
        Collez le lien Instagram ou YouTube de l'aftermovie pour chaque evenement. Activez "Aftermovie visible" dans l'onglet Events d'abord.
      </Text>

      {events.length === 0 ? (
        <View style={styles.noEventsWarning}>
          <Ionicons name="warning" size={20} color={theme.colors.warning} />
          <Text style={styles.noEventsText}>
            Aucun evenement disponible. Creez d'abord un evenement dans l'onglet "Events".
          </Text>
        </View>
      ) : (
        events.map((event) => (
          <View key={event.id} style={styles.linkEventCard}>
            <View style={styles.linkEventHeader}>
              <Ionicons name="videocam" size={18} color={theme.colors.primary} />
              <Text style={styles.linkEventName}>{event.name}</Text>
              <View style={[
                styles.linkStatusBadge,
                { backgroundColor: event.aftermovie_visible ? theme.colors.success + '20' : theme.colors.textMuted + '20' }
              ]}>
                <Text style={[
                  styles.linkStatusText,
                  { color: event.aftermovie_visible ? theme.colors.success : theme.colors.textMuted }
                ]}>
                  {event.aftermovie_visible ? 'Visible' : 'Masque'}
                </Text>
              </View>
            </View>
            <TextInput
              key={`aftermovie-${event.id}-${event.aftermovie_url || ''}`}
              style={styles.linkEventInput}
              defaultValue={event.aftermovie_url || ''}
              placeholder="https://www.instagram.com/reel/... ou https://youtube.com/..."
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onEndEditing={(e) => {
                const url = e.nativeEvent.text.trim();
                if (url !== (event.aftermovie_url || '')) {
                  api.put(`/admin/events/${event.id}/visibility`, { aftermovie_url: url })
                    .then(() => { Alert.alert('Sauvegarde', 'Lien aftermovie mis a jour'); loadData(); })
                    .catch(() => Alert.alert('Erreur', 'Impossible de sauvegarder le lien'));
                }
              }}
            />
            {!event.aftermovie_visible && (
              <TouchableOpacity
                style={styles.linkActivateButton}
                onPress={() => handleToggleVisibility(event.id, 'aftermovie_visible', false)}
              >
                <Ionicons name="eye" size={16} color={theme.colors.primary} />
                <Text style={styles.linkActivateText}>Activer Aftermovie visible</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
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
            <Text style={styles.inputLabel}>Heure de l'événement * (HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="23:00"
              placeholderTextColor={theme.colors.textMuted}
              value={eventTime}
              onChangeText={setEventTime}
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
            <Text style={styles.inputLabel}>💰 Prix du billet (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="20"
              placeholderTextColor={theme.colors.textMuted}
              value={eventTicketPrice}
              onChangeText={setEventTicketPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📸 Flyer de l'événement</Text>
            
            {/* Upload Button */}
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickEventFlyer()}
            >
              <Ionicons name="cloud-upload" size={24} color={theme.colors.primary} />
              <Text style={styles.uploadButtonText}>Sélectionner une image</Text>
            </TouchableOpacity>

            {/* Or use URL */}
            <Text style={styles.orText}>ou entrez une URL :</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={theme.colors.textMuted}
              value={eventBannerUrl}
              onChangeText={setEventBannerUrl}
              autoCapitalize="none"
            />

            {/* Preview */}
            {eventBannerUrl ? (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Aperçu :</Text>
                <Image 
                  source={{ uri: eventBannerUrl }} 
                  style={styles.flyerPreview}
                  resizeMode="cover"
                />
              </View>
            ) : null}
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
                {event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'Date non définie'}
              </Text>
            </View>
            <Ionicons name="create-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Visibility Toggles */}
          <View style={styles.visibilitySection}>
            {/* Visible in Tickets Toggle */}
            <Pressable
              style={({ pressed }) => [
                styles.visibilityToggle,
                event.visible_in_tickets !== false && styles.visibilityToggleActive,
                pressed && { opacity: 0.6 }
              ]}
              onPress={() => {
                handleToggleVisibility(event.id, 'visible_in_tickets', event.visible_in_tickets !== false);
              }}
            >
              <Ionicons
                name={event.visible_in_tickets !== false ? "ticket" : "ticket-outline"}
                size={16}
                color={event.visible_in_tickets !== false ? theme.colors.success : theme.colors.textMuted}
              />
              <Text style={[
                styles.visibilityToggleText,
                event.visible_in_tickets !== false && styles.visibilityToggleTextActive
              ]}>
                {event.visible_in_tickets !== false ? 'Visible' : 'Masque'} tickets
              </Text>
            </Pressable>
          </View>

          {/* Event Type Selector */}
          <View style={styles.eventTypeSection}>
            <Text style={styles.eventTypeLabel}>Type d'evenement:</Text>
            <View style={styles.eventTypeButtons}>
              {[
                { key: 'regular', label: 'Mensuel' },
                { key: 'open_air', label: 'Open Air' },
              ].map((type) => (
                <Pressable
                  key={type.key}
                  style={({ pressed }) => [
                    styles.eventTypeButton,
                    (event.event_type || 'regular') === type.key && styles.eventTypeButtonActive,
                    pressed && { opacity: 0.6 }
                  ]}
                  onPress={() => {
                    handleChangeEventType(event.id, type.key);
                  }}
                >
                  <Text style={[
                    styles.eventTypeButtonText,
                    (event.event_type || 'regular') === type.key && styles.eventTypeButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Gallery & Aftermovie Toggles + External Links */}
          <View style={styles.visibilitySection}>
            <Pressable
              style={({ pressed }) => [
                styles.visibilityToggle,
                event.gallery_visible && styles.visibilityToggleActive,
                pressed && { opacity: 0.6 }
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
                Photos {event.gallery_visible ? 'visibles' : 'masquees'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.visibilityToggle,
                event.aftermovie_visible && styles.visibilityToggleActive,
                pressed && { opacity: 0.6 }
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
                Aftermovie {event.aftermovie_visible ? 'visible' : 'masque'}
              </Text>
            </Pressable>
          </View>

          {/* External Links for Gallery & Aftermovie */}
          {event.gallery_visible && (
            <View style={styles.linkInputSection}>
              <Text style={styles.linkInputLabel}>Lien album photos (Facebook)</Text>
              <View style={styles.linkInputRow}>
                <TextInput
                  key={`event-gallery-${event.id}-${event.gallery_url || ''}`}
                  style={styles.linkInput}
                  defaultValue={event.gallery_url || ''}
                  placeholder="https://www.facebook.com/album/..."
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  onEndEditing={(e) => {
                    const url = e.nativeEvent.text.trim();
                    if (url !== (event.gallery_url || '')) {
                      api.put(`/admin/events/${event.id}/visibility`, { gallery_url: url })
                        .then(() => loadData())
                        .catch(() => Alert.alert('Erreur', 'Impossible de sauvegarder le lien'));
                    }
                  }}
                />
              </View>
            </View>
          )}

          {event.aftermovie_visible && (
            <View style={styles.linkInputSection}>
              <Text style={styles.linkInputLabel}>Lien aftermovie (Instagram/YouTube)</Text>
              <View style={styles.linkInputRow}>
                <TextInput
                  key={`event-aftermovie-${event.id}-${event.aftermovie_url || ''}`}
                  style={styles.linkInput}
                  defaultValue={event.aftermovie_url || ''}
                  placeholder="https://www.instagram.com/reel/..."
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  onEndEditing={(e) => {
                    const url = e.nativeEvent.text.trim();
                    if (url !== (event.aftermovie_url || '')) {
                      api.put(`/admin/events/${event.id}/visibility`, { aftermovie_url: url })
                        .then(() => loadData())
                        .catch(() => Alert.alert('Erreur', 'Impossible de sauvegarder le lien'));
                    }
                  }}
                />
              </View>
            </View>
          )}

          {/* Delete Button */}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteEvent(event.id, event.name)}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
            <Text style={styles.deleteButtonText}>Supprimer cet événement</Text>
          </TouchableOpacity>
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
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
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
              onPress={() => {
                Keyboard.dismiss();
                setActiveTab(tab.key);
              }}
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
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingBottom: 350 }}
        >
          {activeTab === 'welcome' && renderWelcomeTab()}
          {activeTab === 'flyer' && renderFlyerTab()}
          {activeTab === 'photos' && renderPhotosTab()}
          {activeTab === 'aftermovies' && renderAftermoviesTab()}
          {activeTab === 'events' && renderEventsTab()}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dangerButtonText: {
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
  featuredToggleActive: {
    backgroundColor: '#FFD70020',
  },
  eventTypeSection: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.elevated,
  },
  eventTypeLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  eventTypeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  eventTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  eventTypeButtonActive: {
    backgroundColor: theme.colors.primary + '30',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  eventTypeButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  eventTypeButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  linkInputSection: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  linkInputLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  linkInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkInput: {
    flex: 1,
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBackground,
  },
  linkEventCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  linkEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  linkEventName: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  linkStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  linkStatusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  linkEventInput: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    borderWidth: 1,
    borderColor: theme.colors.elevated,
  },
  linkActivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  linkActivateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.error + '15',
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  deleteButtonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.medium,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  uploadButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  orText: {
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginVertical: theme.spacing.sm,
  },
  previewContainer: {
    marginTop: theme.spacing.md,
  },
  welcomeFlyerPreview: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  saveButtonText: {
    fontSize: theme.fontSize.md,
    color: 'white',
    fontWeight: theme.fontWeight.bold,
  },
  // Dropdown styles
  dropdownContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.elevated,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  dropdownItemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  noEventsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.warning + '40',
  },
  noEventsText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.warning,
  },
});
