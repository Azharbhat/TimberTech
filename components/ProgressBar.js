// components/ProgressBar.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProgressBar({ total = 0, paid = 0, remaining = 0, label = '' }) {
  // calculate percentages
  const paidPercent = total > 0 ? (paid / total) * 100 : 0;
  const remainingPercent = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.barBackground}>
        <View style={[styles.barPaid, { flex: paidPercent }]} ><Text style={styles.percentageText}> {Math.round(paidPercent)}%</Text></View>
        <View style={[styles.barRemaining, { flex: remainingPercent }]} ><Text style={styles.percentageText}>{Math.round(remainingPercent)}%</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  barBackground: {
    flexDirection: 'row',
    width: '100%',
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barPaid: {
    backgroundColor: '#2E8B57',
  },
  barRemaining: {
    backgroundColor: '#CD5C5C',
  },
  percentageText: {
    fontSize: 12,
    paddingRight:"3%",
    marginTop:2,
    color: '#ffffffff',
    textAlign: 'right',
  },
});
