import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../src/config/theme';
import { useLanguage } from '../src/context/LanguageContext';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/config/api';
import logger from '../src/config/logger';
import { GlassCard } from '../src/components/ui/GlassCard';
import { GradientButton } from '../src/components/ui/GradientButton';
import { PressableScale } from '../src/components/ui/PressableScale';
import { Skeleton } from '../src/components/ui/Skeleton';

// Default content (fallback)
const DEFAULT_FLYER = require('../assets/images/event-flyer.jpg');

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

interface WelcomeContent {
  flyer_url?: string;
  tagline?: string;
  venue_name?: string;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { logout } = useAuth();  // Removed loadUser - handled by _layout.tsx
  const [content, setContent] = useState<WelcomeContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const appState = useRef(AppState.currentState);

  // Soft entrance animation (fade + translateY)
  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(entranceTranslate, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  // Load content on mount AND when app comes back to foreground
  useEffect(() => {
    loadWelcomeContent();

    // Listen for app state changes (background -> foreground)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        logger.log('Welcome: App came to foreground - reloading content...');
        // Force reload fresh data when app comes back
        setContent(null);
        loadWelcomeContent();
        // Do NOT call loadUser() here - _layout.tsx already handles it
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadWelcomeContent = async (retryCount = 0) => {
    try {
      setIsLoadingContent(true);
      // Add cache-busting parameter to avoid stale data
      const response = await api.get(`/welcome-content?t=${Date.now()}`, { timeout: 15000 });
      setContent(response.data);
      logger.log('Welcome content loaded successfully');
    } catch (error: any) {
      logger.log('Error loading welcome content:', error.message);
      // Retry up to 2 times with increasing delay
      if (retryCount < 2) {
        logger.log(`Retrying... attempt ${retryCount + 2}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return loadWelcomeContent(retryCount + 1);
      }
      logger.log('Using default welcome content after retries');
      setContent({}); // Use empty object to trigger default flyer
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Navigate to tabs as guest (without account) - clear any existing session
  const handleExploreAsGuest = async () => {
    // Clear any existing auth token to ensure guest mode
    await AsyncStorage.removeItem('auth_token');
    await logout();
    // Small delay to ensure state updates before navigation
    await new Promise(resolve => setTimeout(resolve, 100));
    router.replace('/(tabs)/home');
  };

  return (
    <LinearGradient
      colors={theme.gradients.night}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'space-between',
            opacity: entranceOpacity,
            transform: [{ translateY: entranceTranslate }],
          }}
        >
          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Language pills */}
            <View style={styles.langRow}>
              {LANGUAGES.map((lang) => (
                <View key={lang.code} style={styles.langPillWrap}>
                  <PressableScale
                    onPress={() => setLanguage(lang.code as any)}
                    accessibilityLabel={lang.name}
                  >
                    <GlassCard
                      variant={language === lang.code ? 'glow' : 'default'}
                      noPadding
                      style={styles.langPill}
                    >
                      <Text style={styles.langFlag}>{lang.flag}</Text>
                      <Text
                        style={[
                          styles.langCode,
                          language === lang.code && styles.langCodeActive,
                        ]}
                      >
                        {lang.code.toUpperCase()}
                      </Text>
                    </GlassCard>
                  </PressableScale>
                </View>
              ))}
            </View>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoHalo} />
              <Image
                source={require('../assets/images/invasion-logo.png')}
                style={styles.logoImage}
                contentFit="contain"
              />
            </View>

            {/* Tagline */}
            <Text style={styles.tagline}>
              {content?.tagline || "The Biggest Latino-Reggaeton Party in Belgium"}
            </Text>

            {/* Event Flyer */}
            <View style={styles.flyerContainer}>
              {isLoadingContent ? (
                <Skeleton width="100%" height={320} borderRadius={theme.borderRadius.lg} />
              ) : (
                <Image
                  source={content?.flyer_url ? { uri: content.flyer_url } : DEFAULT_FLYER}
                  style={styles.flyerImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              )}
              <LinearGradient
                colors={theme.gradients.overlayBottom}
                style={styles.flyerFade}
                pointerEvents="none"
              />
              <GlassCard variant="gold" noPadding style={styles.flyerBadge}>
                <Text style={styles.flyerBadgeText}>{t('nextEventBadge')}</Text>
              </GlassCard>
            </View>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* CTA Buttons */}
            <View style={styles.buttonContainer}>
              <GradientButton
                title={t('getStarted')}
                icon="flash"
                onPress={() => router.push('/auth/register')}
              />

              <PressableScale
                onPress={() => router.push('/auth/login')}
                accessibilityLabel={t('login')}
                style={styles.loginLink}
              >
                <Text style={styles.loginText}>
                  {t('alreadyHaveAccount')} <Text style={styles.loginTextBold}>{t('login')}</Text>
                </Text>
              </PressableScale>

              {/* Explore without account button */}
              <GradientButton
                title={t('exploreWithoutAccount')}
                variant="outline"
                size="md"
                onPress={handleExploreAsGuest}
                style={styles.exploreButton}
              />
            </View>

            {/* Venue Info */}
            <View style={styles.venueInfo}>
              <Text style={styles.venueText}>📍 {content?.venue_name || "Mirano Continental, Brussels"}</Text>
              <Text style={styles.venueSubtext}>{t('sinceYears')}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  logoHalo: {
    position: 'absolute',
    width: 200,
    height: 90,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 229, 204, 0.10)',
    transform: [{ scaleX: 1.4 }],
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
    letterSpacing: 0.3,
  },

  // Flyer
  flyerContainer: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.borders.subtle,
  },
  flyerImage: {
    width: '100%',
    height: 320,
    borderRadius: theme.borderRadius.lg,
  },
  flyerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
  },
  flyerBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  flyerBadgeText: {
    color: theme.colors.secondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },

  // Buttons
  buttonContainer: {
    marginBottom: theme.spacing.lg,
  },
  loginLink: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  loginTextBold: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },

  // Explore without account button
  exploreButton: {
    marginTop: theme.spacing.lg,
  },

  // Venue
  venueInfo: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.borders.subtle,
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

  // Sections
  topSection: {
    flex: 1,
  },
  bottomSection: {
    marginTop: theme.spacing.lg,
  },

  // Language pills
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  langPillWrap: {
    width: 64,
  },
  langPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  langFlag: {
    fontSize: 18,
  },
  langCode: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.5,
    color: theme.colors.textSecondary,
  },
  langCodeActive: {
    color: theme.colors.primary,
  },
});
