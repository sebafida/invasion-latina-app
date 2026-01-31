import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DJRequestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DJ Requests Screen</Text>
      <Text style={styles.subtitle}>This screen is loading!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#B3B3B3',
  },
});
