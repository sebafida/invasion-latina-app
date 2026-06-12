import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { Language } from '../../src/i18n/translations';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { PressableScale } from '../../src/components/ui/PressableScale';

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands' },
];

type FieldName = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    // 3.1 - Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('error'), t('invalidEmail'));
      return;
    }

    // 3.1 - Validation téléphone
    const phoneRegex = /^[+]?[\d\s\-()]{7,15}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert(t('error'), t('invalidPhone'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDontMatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('passwordTooShort'));
      return;
    }

    if (!acceptTerms) {
      Alert.alert(t('error'), t('mustAcceptTerms'));
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password, phone, acceptMarketing);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(t('registrationFailed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    field: FieldName,
    label: string,
    value: string,
    onChange: (v: string) => void,
    inputProps: Partial<React.ComponentProps<typeof TextInput>> = {},
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} *</Text>
      <GlassCard
        noPadding
        style={[styles.inputCard, focusedField === field && styles.inputCardFocused]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textMuted}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          {...inputProps}
        />
      </GlassCard>
    </View>
  );

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
            <Text style={styles.title}>{t('joinInvasionLatina')}</Text>
            <Text style={styles.subtitle}>{t('createAccountSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {renderInput('name', t('fullName'), name, setName, {
              placeholder: 'Jean Dupont',
              autoCapitalize: 'words',
            })}

            {renderInput('email', t('email'), email, setEmail, {
              placeholder: 'ton@email.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}

            {renderInput('phone', t('phoneNumber'), phone, setPhone, {
              placeholder: '+32 470 12 34 56',
              keyboardType: 'phone-pad',
            })}

            {renderInput('password', t('password'), password, setPassword, {
              placeholder: t('minCharacters'),
              secureTextEntry: true,
              autoCapitalize: 'none',
            })}

            {renderInput('confirmPassword', t('confirmPassword'), confirmPassword, setConfirmPassword, {
              placeholder: t('repeatPassword'),
              secureTextEntry: true,
              autoCapitalize: 'none',
            })}

            {/* Consent Checkboxes */}
            <View style={styles.consentSection}>
              {/* Terms and Conditions - Required */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcceptTerms(!acceptTerms)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptTerms }}
                accessibilityLabel={t('acceptTerms')}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Ionicons name="checkmark" size={16} color="#000" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  {t('acceptTerms')}{' '}
                  <Text style={styles.linkText}>{t('termsAndConditions')}</Text>
                  {' '}et{' '}
                  <Text style={styles.linkText}>{t('privacyPolicy')}</Text>
                  {' '}*
                </Text>
              </TouchableOpacity>

              {/* Marketing Consent - Optional */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcceptMarketing(!acceptMarketing)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptMarketing }}
                accessibilityLabel={t('marketingConsent')}
              >
                <View style={[styles.checkbox, acceptMarketing && styles.checkboxChecked]}>
                  {acceptMarketing && <Ionicons name="checkmark" size={16} color="#000" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  {t('marketingConsent')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.requiredNote}>* {t('requiredFields')}</Text>

            {/* Language Selector - glass pills */}
            <View style={styles.languageSection}>
              <Text style={styles.languageTitle}>🌐 {t('appLanguage')}</Text>
              <View style={styles.languageOptions}>
                {LANGUAGES.map((lang) => (
                  <View key={lang.code} style={styles.languageOptionWrap}>
                    <PressableScale
                      onPress={() => setLanguage(lang.code)}
                      accessibilityLabel={lang.label}
                    >
                      <GlassCard
                        variant={language === lang.code ? 'glow' : 'default'}
                        noPadding
                        style={styles.languageOption}
                      >
                        <Text style={styles.languageFlag}>{lang.flag}</Text>
                        <Text style={[
                          styles.languageOptionText,
                          language === lang.code && styles.languageOptionTextSelected
                        ]}>
                          {lang.label}
                        </Text>
                      </GlassCard>
                    </PressableScale>
                  </View>
                ))}
              </View>
            </View>

            <GradientButton
              title={t('createMyAccount')}
              icon="person-add"
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          {/* Footer - Back to Login */}
          <TouchableOpacity
            style={styles.footer}
            onPress={() => router.back()}
          >
            <Text style={styles.footerText}>
              {t('alreadyAccount')} <Text style={styles.footerLink}>{t('login')}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoImage: {
    width: 200,
    height: 100,
  },

  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  form: {
    marginBottom: theme.spacing.lg,
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

  // Consent Section
  consentSection: {
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.borders.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  requiredNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },

  // Language Selector
  languageSection: {
    marginBottom: theme.spacing.lg,
  },
  languageTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.3,
  },
  languageOptions: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.xs / 2,
  },
  languageOptionWrap: {
    flex: 1,
    marginHorizontal: theme.spacing.xs / 2,
  },
  languageOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 75,
    borderRadius: theme.borderRadius.md,
  },
  languageFlag: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  languageOptionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  languageOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});
