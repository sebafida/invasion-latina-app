import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import api from '../../src/config/api';
import { registerForPushNotifications } from '../../src/config/notifications';
import logger from '../../src/config/logger';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { PressableScale } from '../../src/components/ui/PressableScale';

// Only import Apple Authentication on iOS
let AppleAuthentication: any = null;
if (Platform.OS === 'ios') {
  AppleAuthentication = require('expo-apple-authentication');
}

// Only import Google Auth on native platforms
let useAuthRequest: any = null;
if (Platform.OS !== 'web') {
  const Google = require('expo-auth-session/providers/google');
  useAuthRequest = Google.useAuthRequest;
}

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IOS_CLIENT_ID = Constants.expoConfig?.extra?.GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.GOOGLE_ANDROID_CLIENT_ID || '';
const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { login, setUser, setToken, setIsAuthenticating } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const getCurrentLanguage = () => {
    return LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  };

  // Google Auth - only on native platforms
  const googleAuth = isNativePlatform && useAuthRequest ? useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  }) : [null, null, () => {}];

  const [request, response, promptAsync] = googleAuth;

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.authentication?.accessToken);
    }
  }, [response]);

  const handleGoogleSignIn = async (accessToken: string | undefined) => {
    if (!accessToken) return;

    try {
      setIsAuthenticating(true); // BUG 4 FIX: Prevent race condition
      setSocialLoading('google');

      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch Google user info');
      }

      const userInfo = await userInfoResponse.json();

      logger.log('Google user info:', { id: userInfo.id, email: userInfo.email });

      // Send to our backend
      const result = await api.post('/auth/social', {
        provider: 'google',
        id_token: accessToken,
        user_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
      });

      if (result.data.access_token) {
        // BUG 3 FIX: Save auth_version after Google login
        await AsyncStorage.setItem('auth_token', result.data.access_token);
        await AsyncStorage.setItem('auth_version', 'supabase_v3');
        setToken(result.data.access_token);
        setUser(result.data);

        // 2.2 - Activer les notifications push après Google login
        registerForPushNotifications().catch(err => {
          logger.error('Push notification registration failed:', err);
        });

        // Navigation is handled by _layout.tsx useEffect when isAuthenticated changes
      }
    } catch (error: any) {
      logger.error('Google sign in error:', error);
      Alert.alert(t('error'), t('googleSignInFailed') || 'Google sign in failed. Please try again.');
    } finally {
      setSocialLoading(null);
      setIsAuthenticating(false); // BUG 4 FIX: Reset flag
    }
  };

  const handleAppleSignIn = async (retryCount = 0) => {
    // Safety check - Apple Sign In only available on iOS
    if (Platform.OS !== 'ios' || !AppleAuthentication) {
      Alert.alert(t('error'), 'Apple Sign In is only available on iOS');
      return;
    }

    try {
      setIsAuthenticating(true); // BUG 4 FIX: Prevent race condition
      setSocialLoading('apple');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      logger.log('Apple credential received:', {
        user: credential.user,
        email: credential.email,
        hasIdentityToken: !!credential.identityToken
      });

      // Apple only provides email on first sign in
      // For subsequent sign ins, we need to use the user ID to find the account
      const email = credential.email || `${credential.user}@privaterelay.appleid.com`;

      // Get name from Apple credential (only available on first sign in)
      let userName = undefined;
      if (credential.fullName) {
        const givenName = credential.fullName.givenName || '';
        const familyName = credential.fullName.familyName || '';
        const fullName = `${givenName} ${familyName}`.trim();
        if (fullName && fullName.length > 0) {
          userName = fullName;
        }
      }

      // Send to our backend with retry logic
      try {
        const result = await api.post('/auth/social', {
          provider: 'apple',
          id_token: credential.identityToken,
          user_id: credential.user,
          email: email,
          name: userName,
        }, { timeout: 15000 });

        if (result.data.access_token) {
          await AsyncStorage.setItem('auth_token', result.data.access_token);
          await AsyncStorage.setItem('auth_version', 'supabase_v3');
          setToken(result.data.access_token);
          setUser(result.data);

          // 2.2 - Activer les notifications push après Apple login
          registerForPushNotifications().catch(err => {
            logger.error('Push notification registration failed:', err);
          });

          // Navigation is handled by _layout.tsx useEffect when isAuthenticated changes
        }
      } catch (apiError: any) {
        // Retry on network errors
        if (!apiError.response && retryCount < 2) {
          logger.log(`Apple Sign In: Network error, retrying in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          setSocialLoading(null);
          return handleAppleSignIn(retryCount + 1);
        }
        throw apiError;
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled
        return;
      }
      logger.error('Apple sign in error:', error);
      Alert.alert(t('error'), t('appleSignInFailed') || 'Apple sign in failed. Please try again or use email login.');
    } finally {
      setSocialLoading(null);
      setIsAuthenticating(false); // BUG 4 FIX: Reset flag
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('fillAllFields') || 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      logger.log('Attempting login...');
      await login(email, password);
      logger.log('Login successful');
      // Navigation is handled by _layout.tsx useEffect when isAuthenticated changes
    } catch (error: any) {
      logger.error('Login error:', error);
      Alert.alert(t('error'), t('loginFailed') || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/invasion-logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('welcome')}</Text>
            <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
          </View>

          {/* Language Selector */}
          <PressableScale
            onPress={() => setShowLanguageModal(true)}
            accessibilityLabel={t('chooseLanguage')}
            style={styles.languageSelector}
          >
            <Text style={styles.languageSelectorText}>
              {getCurrentLanguage().flag} {getCurrentLanguage().name}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
          </PressableScale>

          {/* Social Login Buttons - Only on native platforms */}
          {isNativePlatform && (
            <>
              <View style={styles.socialButtons}>
                {Platform.OS === 'ios' && (
                  <PressableScale
                    onPress={() => handleAppleSignIn()}
                    disabled={socialLoading !== null}
                    accessibilityLabel={t('continueWithApple')}
                    style={styles.appleButton}
                  >
                    {socialLoading === 'apple' ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <>
                        <Ionicons name="logo-apple" size={22} color="#000000" />
                        <Text style={styles.appleButtonText}>{t('continueWithApple')}</Text>
                      </>
                    )}
                  </PressableScale>
                )}

                <PressableScale
                  onPress={() => promptAsync()}
                  disabled={!request || socialLoading !== null}
                  accessibilityLabel={t('continueWithGoogle')}
                  style={styles.googleButton}
                >
                  {socialLoading === 'google' ? (
                    <ActivityIndicator color="#333" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={20} color="#4285F4" />
                      <Text style={styles.googleButtonText}>{t('continueWithGoogle')}</Text>
                    </>
                  )}
                </PressableScale>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('or')}</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('email')}</Text>
              <GlassCard
                noPadding
                style={[styles.inputCard, focusedField === 'email' && styles.inputCardFocused]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="ton@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </GlassCard>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('password')}</Text>
              <GlassCard
                noPadding
                style={[styles.inputCard, focusedField === 'password' && styles.inputCardFocused]}
              >
                <TextInput
                  style={styles.input}
                  placeholder={t('enterPassword')}
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </GlassCard>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => Alert.alert(
                t('forgotPassword'),
                t('forgotPasswordMessage')
              )}
            >
              <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>

            <GradientButton
              title={t('login')}
              icon="log-in-outline"
              onPress={handleLogin}
              loading={loading}
            />
          </View>

          {/* Footer */}
          <TouchableOpacity
            style={styles.footer}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.footerText}>
              {t('noAccount')} <Text style={styles.footerLink}>{t('register')}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                accessibilityRole="button"
                accessibilityLabel={t('close')}
              >
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoImage: {
    width: 220,
    height: 110,
  },

  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },

  // Social Buttons
  socialButtons: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    minHeight: 50,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  appleButtonText: {
    color: '#000000',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    minHeight: 50,
    gap: theme.spacing.sm,
  },
  googleButtonText: {
    color: '#333',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.borders.subtle,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  form: {
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.3,
  },
  inputCard: {
    borderRadius: theme.borderRadius.md,
  },
  inputCardFocused: {
    borderColor: theme.borders.brand,
  },
  input: {
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },

  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },

  // Language Selector
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: theme.borders.subtle,
  },
  languageSelectorText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
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
    borderTopWidth: 1,
    borderTopColor: theme.borders.subtle,
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  languageModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
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
    borderWidth: 1,
    borderColor: 'transparent',
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
    fontWeight: theme.fontWeight.medium,
  },
  languageOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
});
