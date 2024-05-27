import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function LogSavedDetail({ route }) {
  // Extract the data passed from navigation
  const { data } = route.params;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: '#8B4513' }]}>Name: {data.name}</Text>
      <Text style={styles.subtitle}>Total: {data.total}</Text>
      <Text style={styles.subtitle}>Date: {new Date(data.timestamp).toLocaleString()}</Text>
      <View style={styles.header}>
        <Text style={styles.headerText}>Length</Text>
        <Text style={styles.headerText}>Thickness</Text>
        <Text style={styles.headerText}>Result</Text>
      </View>
      <FlatList
        data={data.data}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.num1}</Text>
            <Text style={styles.itemText}>{item.selectedValue}</Text>
            <Text style={styles.itemText}> {item.result}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FFF8DC', // Ivory color background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#8B4513', // Wooden color border bottom
    paddingBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 5,
    color: '#8B4513', // Wooden color text
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#D2B48C', // Tan color background
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F5F5DC', // Beige color background
    marginBottom: 5,
    borderRadius: 5,
  },
  itemText: {
    fontSize: 16,
  },
});
