/**
 * Bouton avec feedback tactile premium : scale 0.97 + haptique léger.
 * Remplace TouchableOpacity pour les CTA importants.
 */
import React, { useRef } from 'react';
import { Animated, Pressable, ViewStyle, StyleProp, GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PressableScaleProps {
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  haptic?: boolean;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
}

export function PressableScale({
  onPress,
  onLongPress,
  disabled,
  haptic = true,
  scaleTo = 0.97,
  style,
  children,
  accessibilityLabel,
  accessibilityRole = 'button',
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

  const handlePress = (e: GestureResponderEvent) => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.5 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default PressableScale;
