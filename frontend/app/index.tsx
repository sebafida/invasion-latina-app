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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../src/config/theme';
import { Button } from '../src/components/Button';
import { useLanguage } from '../src/context/LanguageContext';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/config/api';

const { width } = Dimensions.get('window');

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
  const { logout } = useAuth();
  const [content, setContent] = useState<WelcomeContent>({});
  const [showLanguageModal, setShowLanguageModal] = useState(false);

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

  const getCurrentLanguage = () => {
    return LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Language Selector at top */}
          <TouchableOpacity 
            style={styles.languageSelector}
            onPress={() => setShowLanguageModal(true)}
          >
            <Text style={styles.languageSelectorText}>
              {getCurrentLanguage().flag} {getCurrentLanguage().name}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
          </TouchableOpacity>

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
              <Text style={styles.flyerBadgeText}>{t('nextEventBadge')}</Text>
            </View>
          </View>
        </View>
        
        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* CTA Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title={t('getStarted')}
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
                {t('alreadyHaveAccount')} <Text style={styles.loginTextBold}>{t('login')}</Text>
              </Text>
            </TouchableOpacity>

            {/* Explore without account button */}
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={handleExploreAsGuest}
            >
              <Text style={styles.exploreText}>{t('exploreWithoutAccount')}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Venue Info */}
          <View style={styles.venueInfo}>
            <Text style={styles.venueText}>📍 {content.venue_name || "Mirano Continental, Brussels"}</Text>
            <Text style={styles.venueSubtext}>{t('sinceYears')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.languageModalOverlay}>
          <View style={styles.languageModalContent}>
            <View style={styles.languageModalHeader}>
              <Text style={styles.languageModalTitle}>{t('chooseLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.languageOptions}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    language === lang.code && styles.languageOptionActive
                  ]}
                  onPress={() => {
                    setLanguage(lang.code as any);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageOptionText,
                    language === lang.code && styles.languageOptionTextActive
                  ]}>
                    {lang.name}
                  </Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    justifyContent: 'space-between',
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
    top: theme.spacing.xs,
    left: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  flyerBadgeText: {
    color: 'white',
    fontSize: theme.fontSize.xs,
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

  // Explore without account button - discrete text style
  exploreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  exploreText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
  },
  
  // Venue
  venueInfo: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
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

  // Sections
  topSection: {
    flex: 1,
  },
  bottomSection: {
    marginTop: theme.spacing.lg,
  },

  // Language Selector
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'center',
  },
  languageSelectorText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as any,
  },

  // Language Modal
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  languageModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  languageModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as any,
    color: theme.colors.textPrimary,
  },
  languageOptions: {
    gap: theme.spacing.md,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.elevated,
    gap: theme.spacing.md,
  },
  languageOptionActive: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  languageOptionFlag: {
    fontSize: 24,
  },
  languageOptionText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    fontWeight: '500' as any,
  },
  languageOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '700' as any,
  },
});
