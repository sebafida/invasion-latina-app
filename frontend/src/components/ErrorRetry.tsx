/**
 * ErrorRetry - Affichage d'erreur reseau reutilisable avec bouton reessayer.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { useLanguage } from '../context/LanguageContext';

interface ErrorRetryProps {
  /** Message personnalise (par defaut: t('connectionError')) */
  message?: string;
  /** Callback pour relancer le chargement */
  onRetry: () => void;
}

export function ErrorRetry({ message, onRetry }: ErrorRetryProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={56} color={theme.colors.textMuted} />
      <Text style={styles.message}>{message || t('connectionError')}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
        <Ionicons name="refresh" size={18} color="white" />
        <Text style={styles.buttonText}>{t('retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  message: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
});

export default ErrorRetry;
