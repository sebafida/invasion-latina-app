import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WHATSAPP_NUMBER = '32478814497';
const DEFAULT_MESSAGE = 'Bonjour, j\'ai une question concernant Invasion Latina...';

interface WhatsAppButtonProps {
  bottom?: number;
  scrollY?: Animated.Value;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ bottom = 90, scrollY }) => {
  const handlePress = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open WhatsApp:', err);
    });
  };

  // Animated opacity based on scroll
  const opacity = scrollY 
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0.7, 0],
        extrapolate: 'clamp',
      })
    : 0.7;

  // Animated translateY to slide out
  const translateY = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 100],
        extrapolate: 'clamp',
      })
    : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          bottom,
          opacity,
          transform: [{ translateY }],
        }
      ]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Ionicons name="logo-whatsapp" size={22} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default WhatsAppButton;
