import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { BiometricLock } from '../src/components/BiometricLock';
import { theme } from '../src/config/theme';

function AppContent() {
  const { authState, user, unlock, logout } = useAuth();
  const router = useRouter();

  // When fully authenticated, go to home
  useEffect(() => {
    if (authState === 'authenticated') {
      console.log('AppContent: authenticated - navigating to home');
      router.replace('/(tabs)/home');
    }
  }, [authState]);

  console.log('AppContent render - authState:', authState);

  // LOADING: Show spinner while checking stored token
  if (authState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // LOCKED: User was previously logged in, needs Face ID
  if (authState === 'locked') {
    return (
      <BiometricLock
        onAuthenticated={unlock}
        onCancel={logout}
        userName={user?.name?.split(' ')[0] || 'Familia'}
      />
    );
  }

  // UNAUTHENTICATED: Show login/welcome page
  // AUTHENTICATED: Will redirect via useEffect, show Slot briefly
  return <Slot />;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.black,
  },
});
