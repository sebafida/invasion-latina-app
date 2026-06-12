import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/config/theme';

// Animated logo with subtle shine on mount
const AnimatedLogo = () => {
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Fade in elegantly on mount
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.85, duration: 600, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.Image
      source={require('../../assets/images/invasion-logo.png')}
      style={[styles.headerLogo, { opacity }]}
      resizeMode="contain"
    />
  );
};

// Back button component for non-home tabs
const BackToHomeButton = () => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => router.push('/(tabs)/home')}
      accessibilityRole="button"
      accessibilityLabel="Home"
    >
      <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
    </TouchableOpacity>
  );
};

// Glassmorphism background for the floating tab bar
const TabBarBackground = () => (
  <View style={StyleSheet.absoluteFill}>
    <BlurView tint="dark" intensity={60} style={StyleSheet.absoluteFill} />
    {/* Dark scrim so the blur stays legible on Android / low-blur devices */}
    <View style={styles.tabBarScrim} />
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: theme.borders.subtle,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
          paddingHorizontal: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
        headerStyle: {
          backgroundColor: theme.colors.black,
          borderBottomColor: theme.colors.elevated,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          // ============================================
          // CUSTOM HEADER WITH CENTERED LOGO
          // ============================================
          headerTitleAlign: 'center',
          headerTitle: () => <AnimatedLogo />,
          headerLeft: () => (
            <View style={styles.headerSpacer} />
          ),
          headerRight: () => (
            <View style={styles.headerSpacer} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket" size={size} color={color} />
          ),
          headerLeft: () => <BackToHomeButton />,
        }}
      />
      <Tabs.Screen
        name="djs"
        options={{
          title: 'DJs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="headset" size={size} color={color} />
          ),
          headerLeft: () => <BackToHomeButton />,
        }}
      />
      <Tabs.Screen
        name="dj"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-note" size={size} color={color} />
          ),
          headerLeft: () => <BackToHomeButton />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../../assets/images/champagne-icon.png')}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
          headerLeft: () => <BackToHomeButton />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerLeft: () => <BackToHomeButton />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLogo: {
    width: 140,
    height: 45,
  },
  headerSpacer: {
    width: 40,
    marginLeft: theme.spacing.md,
  },
  notificationButton: {
    marginRight: theme.spacing.md,
  },
  backButton: {
    marginLeft: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  tabBarScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.6)',
  },
});
