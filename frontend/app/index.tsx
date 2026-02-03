import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/config/theme';
import { Button } from '../src/components/Button';
import api from '../src/config/api';

const { width } = Dimensions.get('window');

// Default content (fallback)
const DEFAULT_FLYER = require('../assets/images/event-flyer.jpg');

interface WelcomeContent {
  flyer_url?: string;
  tagline?: string;
  venue_name?: string;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [content, setContent] = useState<WelcomeContent>({});

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
            <Text style={styles.flyerBadgeText}>Prochain Event</Text>
          </View>
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
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  flyerImage: {
    width: '100%',
    height: 320,
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
