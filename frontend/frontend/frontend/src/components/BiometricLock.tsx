import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { useLanguage } from '../context/LanguageContext';

interface BiometricLockProps {
  onAuthenticated: () => void;
  onCancel: () => void;
  userName?: string;
}

export const BiometricLock: React.FC<BiometricLockProps> = ({
  onAuthenticated,
  onCancel,
  userName,
}) => {
  const { t } = useLanguage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('biometric');

  useEffect(() => {
    checkBiometricType();
    // Auto-trigger authentication on mount
    authenticateWithBiometrics();
  }, []);

  const checkBiometricType = async () => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID');
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('Touch ID');
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      setIsAuthenticating(true);

      // Check if biometrics are available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // No biometrics available, just authenticate
        onAuthenticated();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Déverrouiller Invasion Latina`,
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
        fallbackLabel: 'Utiliser le code',
      });

      if (result.success) {
        onAuthenticated();
      } else if (result.error === 'user_cancel') {
        // User cancelled, stay on lock screen
      } else {
        Alert.alert(
          'Authentification échouée',
          'Veuillez réessayer ou utiliser votre code.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      // If error, let user through
      onAuthenticated();
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Image
          source={require('../../assets/images/invasion-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Welcome message */}
        <Text style={styles.welcomeText}>
          {t('welcomeBack') || 'Bon retour'},
        </Text>
        <Text style={styles.userName}>
          {userName || 'Familia'}!
        </Text>

        {/* Biometric icon */}
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={authenticateWithBiometrics}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <>
              <Ionicons
                name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
                size={64}
                color={theme.colors.primary}
              />
              <Text style={styles.biometricText}>
                {t('tapToUnlock') || `Appuyez pour déverrouiller avec ${biometricType}`}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutButton} onPress={onCancel}>
          <Text style={styles.logoutText}>
            {t('useAnotherAccount') || 'Utiliser un autre compte'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: theme.spacing.xl,
  },
  welcomeText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  userName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xxl,
  },
  biometricButton: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  biometricText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  logoutButton: {
    padding: theme.spacing.md,
  },
  logoutText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
  },
});

export default BiometricLock;
