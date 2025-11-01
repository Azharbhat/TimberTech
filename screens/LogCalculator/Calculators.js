import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GLOBAL_STYLES } from '../../theme/theme';

export default function Calculators({ navigation }) {
  return (
    <View style={GLOBAL_STYLES.container}>
      {/* HEADER */}
      <View style={GLOBAL_STYLES.headerContainer}>
        <Text style={GLOBAL_STYLES.headerText}>Log Calculators</Text>
      </View>

    <View style={{display:'flex',flexDirection:'column',justifyContent:'space-evenly',height:'100%'}}>
           {/* Round Log Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#6A5ACD' }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('LogCalculator')}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="tree-outline" size={60} color="white" />
          <Ionicons name="calculator-outline" size={30} color="white" style={{ marginTop: 5 }} />
        </View>
        <Text style={styles.text}>Round Log</Text>
      </TouchableOpacity>

      {/* Flat Log Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#8B4513' }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('FlatLogCalculator')}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="cube-outline" size={60} color="white" />
          <Ionicons name="calculator-outline" size={30} color="white" style={{ marginTop: 5 }} />
        </View>
        <Text style={styles.text}>Flat Log</Text>
      </TouchableOpacity>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '90%',
    borderRadius: 20,
    paddingVertical: 25,
    marginVertical: 20,
    marginHorizontal:20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    transform: [{ scale: 1 }],
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
});
