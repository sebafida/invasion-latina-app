/**
 * Skeleton de chargement avec pulse animé.
 * Usage : <Skeleton width={120} height={16} /> ou <SkeletonCard />
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, DimensionValue } from 'react-native';
import { theme } from '../../config/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = theme.borderRadius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: theme.colors.elevated, opacity },
        style,
      ]}
    />
  );
}

/** Carte squelette générique : image + 2 lignes de texte */
export function SkeletonCard({ imageHeight = 160 }: { imageHeight?: number }) {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={imageHeight} borderRadius={theme.borderRadius.md} />
      <View style={styles.cardBody}>
        <Skeleton width="65%" height={18} />
        <Skeleton width="40%" height={14} style={{ marginTop: theme.spacing.sm }} />
      </View>
    </View>
  );
}

/** Rangée squelette : avatar rond + 2 lignes */
export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={48} height={48} borderRadius={theme.borderRadius.full} />
      <View style={styles.rowBody}>
        <Skeleton width="55%" height={15} />
        <Skeleton width="35%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.borders.subtle,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardBody: {
    marginTop: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  rowBody: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
});

export default Skeleton;
