import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/config/theme';
import { Button } from '../src/components/Button';

export default function WelcomeScreen() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/invasion-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Tagline */}
        <Text style={styles.tagline}>
          The Biggest Latino-Reggaeton Party in Belgium
        </Text>
        
        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem icon="🎵" text="Request & Vote Songs Live" />
          <FeatureItem icon="🎟️" text="Buy Tickets Instantly" />
          <FeatureItem icon="👑" text="VIP Table Booking" />
          <FeatureItem icon="🛍️" text="Exclusive Merchandise" />
        </View>
        
        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Get Started"
            onPress={() => router.push('/auth/register')}
            variant="primary"
            size="lg"
            fullWidth
          />
          
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Venue Info */}
        <View style={styles.venueInfo}>
          <Text style={styles.venueText}>📍 Mirano Continental, Brussels</Text>
          <Text style={styles.venueSubtext}>16 Years of Latin Passion</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  logo: {
    fontSize: 56,
    fontWeight: '900' as any,
    color: theme.colors.primary,
    letterSpacing: 4,
  },
  logoSubtitle: {
    fontSize: 32,
    fontWeight: '700' as any,
    color: theme.colors.secondary,
    letterSpacing: 8,
  },
  neonLine: {
    width: 200,
    height: 3,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  
  tagline: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    lineHeight: 28,
  },
  
  featuresContainer: {
    marginBottom: theme.spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  featureText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    fontWeight: '600' as any,
    flex: 1,
  },
  
  buttonContainer: {
    marginBottom: theme.spacing.xl,
  },
  loginLink: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  loginTextBold: {
    color: theme.colors.primary,
    fontWeight: '700' as any,
  },
  
  venueInfo: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBackground,
  },
  venueText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    marginBottom: theme.spacing.sm,
  },
  venueSubtext: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
  },
  
  loadingText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
  },
});