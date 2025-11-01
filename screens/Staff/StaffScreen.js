import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StaffScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Staff Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8DC' },
  text: { fontSize: 24, color: '#8B4513' },
});
