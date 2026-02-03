import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../src/config/theme';

export default function AftermoviesScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>🎬 Aftermovies</Text>
            <Text style={styles.subtitle}>Revois les meilleures soirées</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="videocam" size={24} color={theme.colors.neonPink} />
          <Text style={styles.infoText}>
            Les aftermovies sont publiés quelques jours après chaque événement!
          </Text>
        </View>

        {/* Coming Soon */}
        <View style={styles.comingSoon}>
          <Ionicons name="film-outline" size={80} color={theme.colors.textMuted} />
          <Text style={styles.comingSoonTitle}>Bientôt disponible</Text>
          <Text style={styles.comingSoonText}>
            Les aftermovies des prochains événements seront publiés ici
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>📹 Ce qui vous attend</Text>
          
          <View style={styles.featureCard}>
            <Ionicons name="play-circle" size={32} color={theme.colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Vidéos HD</Text>
              <Text style={styles.featureDesc}>
                Regardez les meilleurs moments en haute qualité
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="musical-notes" size={32} color={theme.colors.neonPink} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Best Tracks</Text>
              <Text style={styles.featureDesc}>
                Retrouvez les sons qui ont fait vibrer la soirée
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="share-social" size={32} color={theme.colors.neonBlue} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Partage</Text>
              <Text style={styles.featureDesc}>
                Partage les vidéos sur tes réseaux sociaux
              </Text>
            </View>
          </View>
        </View>

        {/* Subscribe CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>🔔 Reste connecté!</Text>
          <Text style={styles.ctaText}>
            Suis-nous sur les réseaux pour ne rater aucun aftermovie
          </Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-instagram" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-tiktok" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-youtube" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },

  content: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Coming Soon
  comingSoon: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  comingSoonTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  comingSoonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },

  // Features
  featuresSection: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  featuresTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  featureDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  // CTA
  ctaCard: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  ctaTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  ctaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});