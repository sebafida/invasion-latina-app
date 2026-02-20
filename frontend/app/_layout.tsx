import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { BiometricLock } from '../src/components/BiometricLock';
import { theme } from '../src/config/theme';

function AppContent() {
  const { isLoading, isLocked, isAuthenticated, user, setIsLocked, logout } = useAuth();
  const router = useRouter();

  // When user is authenticated and not locked, go to home
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isLocked) {
      router.replace('/(tabs)/home');
    }
  }, [isLoading, isAuthenticated, isLocked]);

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // User is authenticated but app is locked = RETURNING USER
  // Show Face ID screen
  if (isAuthenticated && isLocked) {
    return (
      <BiometricLock
        onAuthenticated={() => {
          // Face ID success - unlock and go to home
          setIsLocked(false);
        }}
        onCancel={() => {
          // Face ID cancelled - log out and show login page
          logout();
        }}
        userName={user?.name?.split(' ')[0] || 'Familia'}
      />
    );
  }

  // Not authenticated = show welcome/login page
  // OR authenticated and not locked = will redirect to home via useEffect
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
