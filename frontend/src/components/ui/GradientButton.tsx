/**
 * CTA premium : dégradé de marque, scale au press, haptique, état loading.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import PressableScale from './PressableScale';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'brand' | 'gold' | 'danger' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function GradientButton({
  title,
  onPress,
  variant = 'brand',
  icon,
  loading,
  disabled,
  size = 'lg',
  style,
}: GradientButtonProps) {
  const isOutline = variant === 'outline';
  const colors =
    variant === 'gold' ? theme.gradients.gold
    : variant === 'danger' ? theme.gradients.danger
    : theme.gradients.brand;
  const textColor = isOutline ? theme.colors.primary : '#000';

  const content = (
    <View style={[styles.inner, size === 'md' && styles.innerMd]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'lg' ? 20 : 17} color={textColor} style={styles.icon} />}
          <Text style={[styles.text, size === 'md' && styles.textMd, { color: textColor }]}>{title}</Text>
        </>
      )}
    </View>
  );

  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} style={style} accessibilityLabel={title}>
      {isOutline ? (
        <View style={[styles.gradient, styles.outline]}>{content}</View>
      ) : (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, variant === 'brand' && theme.shadows.neon, variant === 'gold' && theme.shadows.goldGlow]}
        >
          {content}
        </LinearGradient>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0, 229, 204, 0.06)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 54,
  },
  innerMd: {
    paddingVertical: 11,
    minHeight: 42,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.4,
  },
  textMd: {
    fontSize: theme.fontSize.sm,
  },
});

export default GradientButton;
