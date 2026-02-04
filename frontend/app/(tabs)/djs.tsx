import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/config/theme';
import api from '../../src/config/api';
import { useAuth } from '../../src/context/AuthContext';

interface DJ {
  id: string;
  name: string;
  type: 'dj' | 'mc';
  photo_url?: string;
  instagram_url?: string;
  is_resident: boolean;
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

// Default DJs data (will be replaced by API data when available)
const DEFAULT_DJS: DJ[] = [
  {
    id: '1',
    name: 'DJ GIZMO',
    type: 'dj',
    instagram_url: 'https://www.instagram.com/gizmodj/',
    is_resident: true,
  },
  {
    id: '2',
    name: 'DJ DNK',
    type: 'dj',
    instagram_url: 'https://www.instagram.com/deejaydnk/',
    is_resident: true,
  },
  {
    id: '3',
    name: 'DJ CRUZ',
    type: 'dj',
    instagram_url: 'https://www.instagram.com/djaycruz/',
    is_resident: true,
  },
  {
    id: '4',
    name: 'DJ DANIEL MURILLO',
    type: 'dj',
    instagram_url: 'https://www.instagram.com/danielmurillodj/',
    is_resident: true,
  },
  {
    id: '5',
    name: 'DJ SUNCEE',
    type: 'dj',
    instagram_url: 'https://www.instagram.com/deejaysuncee/',
    is_resident: true,
  },
  {
    id: '6',
    name: 'DJ SAMO',
    type: 'dj',
    instagram_url: 'https://www.instagram.com/djsamobe/',
    is_resident: true,
  },
  {
    id: '7',
    name: 'DJ MABOY',
    type: 'dj',
    instagram_url: 'https://www.instagram.com/dj.maboy/',
    is_resident: true,
  },
  {
    id: '8',
    name: 'MC VELASQUEZ',
    type: 'mc',
    instagram_url: 'https://www.instagram.com/santiagovelaskz/',
    is_resident: true,
  },
];

export default function DJsScreen() {
  const { user } = useAuth();
  const [djs, setDjs] = useState<DJ[]>(DEFAULT_DJS);
  const [loading, setLoading] = useState(false);
  
  // Song request states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadDJs();
  }, []);

  const loadDJs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/djs');
      if (response.data && response.data.length > 0) {
        setDjs(response.data);
      }
    } catch (error) {
      console.log('Using default DJs data');
      // Keep default data if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSongRequest = async () => {
    if (!songTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le titre de la chanson');
      return;
    }
    if (!artistName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de l\'artiste');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/dj/request-song', {
        song_title: songTitle.trim(),
        artist_name: artistName.trim(),
        user_name: user?.name || 'Anonyme'
      });
      
      // Reset form and close modal
      setSongTitle('');
      setArtistName('');
      setShowRequestModal(false);
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de l\'envoi';
      Alert.alert('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

  const openInstagram = async (url: string) => {
    try {
      // Extract username from URL (e.g., https://www.instagram.com/gizmodj/ -> gizmodj)
      const username = url.split('/').filter(Boolean).pop();
      
      // Try to open Instagram app directly with deep link
      const instagramAppUrl = `instagram://user?username=${username}`;
      
      const canOpenApp = await Linking.canOpenURL(instagramAppUrl);
      
      if (canOpenApp) {
        // Open directly in Instagram app
        await Linking.openURL(instagramAppUrl);
      } else {
        // Fallback to web browser if Instagram app not installed
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open Instagram:', error);
      // Final fallback
      Linking.openURL(url).catch(e => console.error('Fallback failed:', e));
    }
  };

  const djList = djs.filter(d => d.type === 'dj');
  const mcList = djs.filter(d => d.type === 'mc');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadDJs}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nos DJs</Text>
        </View>

        {/* DJs Grid */}
        <View style={styles.djGrid}>
          {djList.map((dj) => (
            <TouchableOpacity
              key={dj.id}
              style={styles.djCard}
              onPress={() => dj.instagram_url && openInstagram(dj.instagram_url)}
              activeOpacity={0.8}
            >
              {/* Photo */}
              <View style={styles.photoContainer}>
                {DJ_PHOTOS[dj.name] ? (
                  <Image
                    source={DJ_PHOTOS[dj.name]}
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
                  <View style={styles.placeholderPhoto}>
                    <Ionicons name="headset" size={40} color={theme.colors.primary} />
                  </View>
                )}
                
                {/* Instagram Icon */}
                {dj.instagram_url && (
                  <View style={styles.instagramBadge}>
                    <Ionicons name="logo-instagram" size={16} color="white" />
                  </View>
                )}
              </View>

              {/* Name */}
              <Text style={styles.djName}>{dj.name}</Text>
              
              {/* Tap to follow */}
              {dj.instagram_url && (
                <Text style={styles.followText}>Suivre sur Instagram</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* MC Section */}
        {mcList.length > 0 && (
          <>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>MC</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.mcSection}>
              {mcList.map((mc) => (
                <TouchableOpacity
                  key={mc.id}
                  style={styles.mcCard}
                  onPress={() => mc.instagram_url && openInstagram(mc.instagram_url)}
                  activeOpacity={0.8}
                >
                  {/* Photo */}
                  <View style={styles.mcPhotoContainer}>
                    {DJ_PHOTOS[mc.name] ? (
                      <Image
                        source={DJ_PHOTOS[mc.name]}
                        style={styles.mcPhoto}
                        resizeMode="cover"
                      />
                    ) : mc.photo_url ? (
                      <Image
                        source={{ uri: mc.photo_url }}
                        style={styles.mcPhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.mcPlaceholderPhoto}>
                        <Ionicons name="mic" size={32} color={theme.colors.secondary} />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.mcInfo}>
                    <Text style={styles.mcName}>{mc.name}</Text>
                    <Text style={styles.mcRole}>Master of Ceremonies</Text>
                    {mc.instagram_url && (
                      <View style={styles.mcInstagram}>
                        <Ionicons name="logo-instagram" size={16} color={theme.colors.primary} />
                        <Text style={styles.mcInstagramText}>@{mc.instagram_url.split('/').filter(Boolean).pop()}</Text>
                      </View>
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={24} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="musical-notes" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Reggaeton • Dembow • Latin House</Text>
              <Text style={styles.infoText}>
                Nos DJs résidents font vibrer la scène depuis 2009 avec les meilleurs hits latino!
              </Text>
            </View>
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

  // Resident Badge
  residentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    gap: theme.spacing.xs,
  },
  residentText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },

  // DJ Grid
  djGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  djCard: {
    width: '47%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  djPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  instagramBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E4405F',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.cardBackground,
  },
  djName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  followText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
  },

  // Section Divider
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.elevated,
  },
  dividerText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },

  // MC Section
  mcSection: {
    paddingHorizontal: theme.spacing.xl,
  },
  mcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  mcPhotoContainer: {
    marginRight: theme.spacing.md,
  },
  mcPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  mcPlaceholderPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  mcInfo: {
    flex: 1,
  },
  mcName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  mcRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  mcInstagram: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  mcInstagramText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  // Info Section
  infoSection: {
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Social CTA
  socialCta: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  socialTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  socialText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4405F',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
  },
  instagramButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
});
