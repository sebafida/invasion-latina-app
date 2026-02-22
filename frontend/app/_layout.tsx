import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { theme } from '../src/config/theme';
import logger from '../src/config/logger';
import { warmupBackend } from '../src/config/api';

function AppContent() {
  const { isLoading, isAuthenticated, isAuthenticating, loadUser } = useAuth();
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  // Listen for app state changes (background -> foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Warmup backend first (wake up Supabase connection)
        await warmupBackend();
        
        // BUG 4 FIX: Only re-verify auth if not currently authenticating (social login)
        if (!isAuthenticating) {
          logger.log('App came to foreground - re-verifying auth...');
          loadUser();
        } else {
          logger.log('App came to foreground - skipping auth check (authentication in progress)');
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [loadUser, isAuthenticating]);

  // When user is authenticated, go to home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      logger.log('User authenticated - navigating to home');
      router.replace('/(tabs)/home');
    }
  }, [isLoading, isAuthenticated]);

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Show welcome/login page if not authenticated
  // Or briefly show Slot before redirect if authenticated
  return (
    <>
      <OfflineBanner />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
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
