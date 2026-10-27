import React, { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../config/theme';

const DEFAULT_FLYER = require('../../assets/images/event-flyer.jpg');

interface EventFlyerProps {
  uri?: string | null;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** Flyers contain text: show every edge and size the frame to the original image. */
export function EventFlyer({ uri, accessibilityLabel, style }: EventFlyerProps) {
  return (
    <View style={[styles.frame, style]}>
      <FlyerImage key={uri || 'default'} uri={uri} accessibilityLabel={accessibilityLabel} />
    </View>
  );
}

function FlyerImage({ uri, accessibilityLabel }: Omit<EventFlyerProps, 'style'>) {
  const [aspectRatio, setAspectRatio] = useState(4 / 5);
  const [useFallback, setUseFallback] = useState(false);

  return (
    <Image
      source={uri && !useFallback ? { uri } : DEFAULT_FLYER}
      style={[styles.image, { aspectRatio }]}
      contentFit="contain"
      contentPosition="center"
      accessibilityLabel={accessibilityLabel}
      cachePolicy="memory-disk"
      onLoad={({ source }) => {
        const ratio = source.width / source.height;
        if (source.width > 0 && source.height > 0 && Number.isFinite(ratio)) {
          setAspectRatio(ratio);
        }
      }}
      onError={() => {
        if (uri && !useFallback) setUseFallback(true);
      }}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    backgroundColor: theme.colors.background,
    // Keep the printed corners clear of the parent card's rounded clipping mask.
    padding: theme.spacing.sm,
  },
  image: {
    width: '100%',
  },
});
