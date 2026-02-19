import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

interface ImageUploaderProps {
  label: string;
  currentImageUrl?: string;
  onImageSelected: (uri: string) => void;
  onImageUploaded?: (cloudinaryUrl: string) => void;
  aspectRatio?: [number, number];
  placeholder?: string;
}

// Configuration Cloudinary - à remplacer par vos vraies valeurs
const CLOUDINARY_CLOUD_NAME = ''; // Sera configuré plus tard
const CLOUDINARY_UPLOAD_PRESET = ''; // Sera configuré plus tard

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  currentImageUrl,
  onImageSelected,
  onImageUploaded,
  aspectRatio = [16, 9],
  placeholder = 'Sélectionnez une image',
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const pickImage = async () => {
    // Demander la permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin d\'accéder à votre galerie pour sélectionner une image.'
      );
      return;
    }

    // Ouvrir le sélecteur d'images
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPreviewUri(uri);
      onImageSelected(uri);
      
      // Si Cloudinary est configuré, uploader automatiquement
      if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
        uploadToCloudinary(uri);
      } else {
        Alert.alert(
          'Image sélectionnée',
          'L\'upload automatique vers Cloudinary sera disponible après configuration.\n\nPour l\'instant, vous pouvez utiliser une URL externe.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin d\'accéder à votre caméra pour prendre une photo.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPreviewUri(uri);
      onImageSelected(uri);
      
      if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
        uploadToCloudinary(uri);
      }
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.log('Cloudinary non configuré');
      return;
    }

    setUploading(true);
    
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
        onImageUploaded?.(data.secure_url);
        Alert.alert('Succès', 'Image uploadée avec succès !');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  const showOptions = () => {
    Alert.alert(
      label,
      'Choisissez une source',
      [
        { text: 'Galerie', onPress: pickImage },
        { text: 'Caméra', onPress: takePhoto },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const displayImage = previewUri || currentImageUrl;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity 
        style={styles.uploadArea}
        onPress={showOptions}
        disabled={uploading}
      >
        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Upload en cours...</Text>
          </View>
        ) : displayImage ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: displayImage }} 
              style={styles.preview}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.overlayText}>Modifier</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="cloud-upload" size={48} color={theme.colors.textMuted} />
            <Text style={styles.placeholderText}>{placeholder}</Text>
            <Text style={styles.placeholderSubtext}>Appuyez pour sélectionner</Text>
          </View>
        )}
      </TouchableOpacity>

      {!CLOUDINARY_CLOUD_NAME && (
        <View style={styles.warningBox}>
          <Ionicons name="information-circle" size={16} color={theme.colors.warning} />
          <Text style={styles.warningText}>
            Cloudinary non configuré. Utilisez une URL externe pour l'instant.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: theme.colors.elevated,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    minHeight: 200,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 200,
  },
  placeholderText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  placeholderSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  imageContainer: {
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: 200,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  overlayText: {
    color: 'white',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 200,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
  },
});

export default ImageUploader;
