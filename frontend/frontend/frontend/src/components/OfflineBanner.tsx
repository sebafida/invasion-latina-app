/**
 * Offline Banner Component
 * 2.8 - Détection du mode offline
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../config/theme';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Pas de connexion internet</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ff6b6b',
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});
