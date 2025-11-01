// src/screens/Staff/StaffProfileScreen.js
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';

export default function StaffProfileScreen({ staff, goBack }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.back} onPress={goBack}>⬅ Back</Text>
      <Image source={{ uri: staff.profileImage }} style={styles.image} />
      <Text style={styles.name}>{staff.name}</Text>
      <Text style={styles.info}>Role: {staff.role}</Text>
      <Text style={styles.info}>Salary Info:</Text>
      {staff.role === 'Worker' && (
        <>
          <Text style={styles.info}>Per Box: ₹{staff.salaryPerBox}</Text>
          <Text style={styles.info}>Per Half Box: ₹{staff.salaryPerHalfBox}</Text>
        </>
      )}
      {staff.role === 'BoxMaker' && (
        <Text style={styles.info}>Per Box: ₹{staff.salaryPerBox}</Text>
      )}
      <Text style={styles.info}>Contact: {staff.contact}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8DC', padding: 16 },
  back: { color: '#8B4513', marginBottom: 12, fontSize: 18 },
  image: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: 12 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#8B4513', textAlign: 'center' },
  info: { fontSize: 18, color: '#4B2E05', marginVertical: 4 },
});
