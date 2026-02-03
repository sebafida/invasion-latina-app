import { View, Text, StyleSheet } from 'react-native';

export default function DJRequestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 DJ REQUESTS</Text>
      <Text style={styles.text}>Tab is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    color: '#FFF',
  },
});
