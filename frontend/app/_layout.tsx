import React, { useEffect, useRef } from 'react';
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
  const hasRedirected = useRef(false);

  // Redirect authenticated users to home when unlocked
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isLocked && !hasRedirected.current) {
      // User is authenticated and unlocked - go to home
      hasRedirected.current = true;
      router.replace('/(tabs)/home');
    }
  }, [isLoading, isAuthenticated, isLocked]);

  // Reset redirect flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated]);

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
