/**
 * Compte à rebours isolé et mémoïsé : le setInterval ne re-rend QUE ce
 * composant (et pas tout l'écran home) chaque seconde.
 */
import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../config/theme';

interface CountdownProps {
  targetDate: string | Date;
  labels: { days: string; hours: string; minutes: string; seconds: string };
  /** Rendu quand le compte à rebours atteint zéro */
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function computeTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
    done: false,
  };
}

function CountdownInner({ targetDate, labels, onComplete }: CountdownProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = computeTimeLeft(target);
      setTimeLeft(next);
      if (next.done) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.getTime()]);

  const units: Array<[number, string]> = [
    [timeLeft.days, labels.days],
    [timeLeft.hours, labels.hours],
    [timeLeft.minutes, labels.minutes],
    [timeLeft.seconds, labels.seconds],
  ];

  return (
    <View style={styles.row}>
      {units.map(([value, label], i) => (
        <React.Fragment key={label}>
          {i > 0 && <Text style={styles.separator}>:</Text>}
          <View style={styles.unit}>
            <View style={styles.valueBox}>
              <Text style={styles.value}>{String(value).padStart(2, '0')}</Text>
            </View>
            <Text style={styles.label}>{label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

export const Countdown = memo(CountdownInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  unit: {
    alignItems: 'center',
    minWidth: 64,
  },
  valueBox: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.borders.brand,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    minWidth: 58,
    alignItems: 'center',
  },
  value: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  separator: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginHorizontal: 4,
    marginTop: theme.spacing.sm,
  },
});

export default Countdown;
