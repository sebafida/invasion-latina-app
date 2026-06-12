/**
 * Carte glassmorphism : fond dégradé sombre subtil + bordure hairline.
 * Variant 'glow' pour les cartes mises en avant (bordure turquoise).
 */
import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../config/theme';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'gold';
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

export function GlassCard({ children, variant = 'default', style, noPadding }: GlassCardProps) {
  const borderColor =
    variant === 'glow' ? theme.borders.brand
    : variant === 'gold' ? theme.borders.gold
    : theme.borders.subtle;

  return (
    <LinearGradient
      colors={theme.gradients.nightCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.card,
        { borderColor },
        variant === 'glow' && theme.shadows.neon,
        variant === 'gold' && theme.shadows.goldGlow,
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  padding: {
    padding: theme.spacing.md,
  },
});

export default GlassCard;
