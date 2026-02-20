import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { BiometricLock } from '../src/components/BiometricLock';
import { theme } from '../src/config/theme';

function AppContent() {
  const { isLoading, isLocked, isAuthenticated, user, setIsLocked, logout } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Redirect authenticated users to home after unlock
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isLocked) {
      // If user is authenticated, not locked, and on the welcome page, redirect to home
      const inAuthGroup = segments[0] === '(tabs)';
      if (!inAuthGroup) {
        router.replace('/(tabs)/home');
      }
    }
  }, [isLoading, isAuthenticated, isLocked, segments]);

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Show biometric lock if user is authenticated but app is locked
  if (isAuthenticated && isLocked) {
    return (
      <BiometricLock
        onAuthenticated={() => {
          // Simply unlock - the biometric auth was already done in BiometricLock
          setIsLocked(false);
        }}
        onCancel={logout}
        userName={user?.name?.split(' ')[0] || 'Familia'}
      />
    );
  }

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
