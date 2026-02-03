import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - theme.spacing.xl * 2 - theme.spacing.xs * 2) / 3;

interface Photo {
  id: string;
  url: string;
  thumbnail_url?: string;
  tags: string[];
  uploaded_at: string;
}

export default function EventGalleryScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);

  useEffect(() => {
    loadGallery();
  }, [eventId]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/media/gallery/${eventId}`);
      setPhotos(response.data.photos || []);
      setEventName(response.data.event_name || 'Galerie');
    } catch (error) {
      console.error('Failed to load gallery:', error);
      // Use mock data if API fails
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTagYourself = async (photoId: string) => {
    try {
      await api.post(`/media/photos/${photoId}/tag`, {
        user_id: user?.id
      });
      Alert.alert('Succès', 'Tu as été tagué sur cette photo!');
      setShowTagModal(false);
      loadGallery(); // Refresh
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de se taguer');
    }
  };

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => setSelectedPhoto(item)}
    >
      <Image
        source={{ uri: item.thumbnail_url || item.url }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      {item.tags.includes(user?.id || '') && (
        <View style={styles.taggedBadge}>
          <Ionicons name="person" size={12} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{eventName}</Text>
          <Text style={styles.subtitle}>{photos.length} photos</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des photos...</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>Aucune photo disponible</Text>
          <Text style={styles.emptySubtext}>Les photos seront ajoutées bientôt!</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.photoGrid}
          columnWrapperStyle={styles.photoRow}
        />
      )}

      {/* Photo Viewer Modal */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>

          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.fullImage}
                resizeMode="contain"
              />

              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleTagYourself(selectedPhoto.id)}
                >
                  <Ionicons name="person-add" size={24} color="white" />
                  <Text style={styles.actionText}>Tag Yourself</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="download" size={24} color="white" />
                  <Text style={styles.actionText}>Télécharger</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-social" size={24} color="white" />
                  <Text style={styles.actionText}>Partager</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
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
    padding: theme.spacing.xl,
    paddingTop: 60,
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
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },

  // Photo Grid
  photoGrid: {
    padding: theme.spacing.xl,
  },
  photoRow: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  taggedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: theme.spacing.sm,
  },
  fullImage: {
    width: '100%',
    height: '70%',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionText: {
    color: 'white',
    fontSize: theme.fontSize.sm,
  },
});
