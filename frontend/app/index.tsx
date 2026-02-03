import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/config/theme';
import { Button } from '../src/components/Button';
import api from '../src/config/api';

const { width } = Dimensions.get('window');

// Default content (fallback)
const DEFAULT_FLYER = require('../assets/images/event-flyer.jpg');
const DEFAULT_VIDEO_URL = 'https://customer-assets.emergentagent.com/job_nightlife-hub-19/aftermovie.mp4';

interface WelcomeContent {
  flyer_url?: string;
  video_url?: string;
  tagline?: string;
  venue_name?: string;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [content, setContent] = useState<WelcomeContent>({});
  const [showVideo, setShowVideo] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    loadWelcomeContent();
  }, []);

  const loadWelcomeContent = async () => {
    try {
      const response = await api.get('/welcome-content');
      setContent(response.data);
    } catch (error) {
      console.log('Using default welcome content');
    }
  };

  const handlePlayVideo = () => {
    setShowVideo(true);
    setVideoLoading(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/invasion-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Tagline */}
        <Text style={styles.tagline}>
          {content.tagline || "The Biggest Latino-Reggaeton Party in Belgium"}
        </Text>

        {/* Event Flyer */}
        <View style={styles.flyerContainer}>
          <Image
            source={content.flyer_url ? { uri: content.flyer_url } : DEFAULT_FLYER}
            style={styles.flyerImage}
            resizeMode="cover"
          />
          <View style={styles.flyerBadge}>
            <Text style={styles.flyerBadgeText}>🔥 Prochain Event</Text>
          </View>
        </View>

        {/* Video Section */}
        <View style={styles.videoSection}>
          <Text style={styles.videoTitle}>🎬 Aftermovie</Text>
          
          {!showVideo ? (
            <TouchableOpacity 
              style={styles.videoThumbnail}
              onPress={handlePlayVideo}
              activeOpacity={0.9}
            >
              <Image
                source={content.flyer_url ? { uri: content.flyer_url } : DEFAULT_FLYER}
                style={styles.videoThumbnailImage}
                resizeMode="cover"
              />
              <View style={styles.playButtonOverlay}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={32} color="white" />
                </View>
                <Text style={styles.playText}>Voir l'aftermovie</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.videoWrapper}>
              {videoLoading && (
                <View style={styles.videoLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              )}
              <Video
                ref={videoRef}
                source={{ uri: content.video_url || DEFAULT_VIDEO_URL }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                onLoad={() => setVideoLoading(false)}
                onError={(error) => {
                  console.log('Video error:', error);
                  setVideoLoading(false);
                }}
              />
              <TouchableOpacity 
                style={styles.closeVideoButton}
                onPress={() => {
                  setShowVideo(false);
                  videoRef.current?.pauseAsync();
                }}
              >
                <Ionicons name="close-circle" size={32} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Commencer"
            onPress={() => router.push('/auth/register')}
            variant="primary"
            size="lg"
            fullWidth
          />
          
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginText}>
              Déjà un compte? <Text style={styles.loginTextBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Venue Info */}
        <View style={styles.venueInfo}>
          <Text style={styles.venueText}>📍 {content.venue_name || "Mirano Continental, Brussels"}</Text>
          <Text style={styles.venueSubtext}>Since 2009 • 16 Years of Latin Passion</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoImage: {
    width: 220,
    height: 110,
  },
  
  // Tagline
  tagline: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  // Flyer
  flyerContainer: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  flyerImage: {
    width: '100%',
    height: 280,
    borderRadius: theme.borderRadius.lg,
  },
  flyerBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  flyerBadgeText: {
    color: 'white',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  // Video Section
  videoSection: {
    marginBottom: theme.spacing.xl,
  },
  videoTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  videoThumbnail: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnailImage: {
    width: '100%',
    height: 180,
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
    marginBottom: theme.spacing.sm,
  },
  playText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  videoWrapper: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBackground,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: 200,
  },
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    zIndex: 1,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  closeVideoButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 10,
  },
  
  // Buttons
  buttonContainer: {
    marginBottom: theme.spacing.lg,
  },
  loginLink: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  loginTextBold: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  
  // Venue
  venueInfo: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBackground,
  },
  venueText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    marginBottom: theme.spacing.xs,
  },
  venueSubtext: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
  },
});
