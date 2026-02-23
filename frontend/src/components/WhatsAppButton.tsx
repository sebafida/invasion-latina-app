import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WHATSAPP_NUMBER = '32478814497';
const DEFAULT_MESSAGE = 'Bonjour, j\'ai une question concernant Invasion Latina...';

interface WhatsAppButtonProps {
  bottom?: number;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ bottom = 90 }) => {
  const handlePress = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open WhatsApp:', err);
    });
  };

  return (
    <TouchableOpacity
      style={[styles.button, { bottom }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons name="logo-whatsapp" size={28} color="white" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
});

export default WhatsAppButton;
