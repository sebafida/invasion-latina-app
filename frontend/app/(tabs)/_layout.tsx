import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/config/theme';

// Back button component for non-home tabs
const BackToHomeButton = () => {
  const router = useRouter();
  return (
    <TouchableOpacity 
      style={styles.backButton}
      onPress={() => router.push('/(tabs)/home')}
    >
      <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.black,
          borderTopColor: theme.colors.elevated,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
          paddingHorizontal: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
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
          headerTitle: () => (
            <Image 
              source={require('../../assets/images/invasion-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ),
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
        }}
      />
      <Tabs.Screen
        name="djs"
        options={{
          title: 'DJs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="headset" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dj"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-note" size={size} color={color} />
          ),
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
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
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
});