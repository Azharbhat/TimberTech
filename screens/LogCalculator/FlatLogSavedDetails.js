import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function FlatLogSavedDetail({ route }) {
  // Extract the data passed from navigation
  const { data } = route.params;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: '#8B4513' }]}>Name: {data.name}</Text>
      <Text style={styles.subtitle}>TotalArea: {data.totalArea}</Text>
      <Text style={styles.subtitle}>TotalPrice: {data.totalPrice}</Text>
      <Text style={styles.subtitle}>Date: {new Date(data.timestamp).toLocaleString()}</Text>
      
      <FlatList
        data={data.data}
        renderItem={({ item }) => (
            <View style={styles.item}>
            <View style={{ display: 'flex', flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between' }}>
              <Text>Length: {item.lengthFeet} feet</Text>
              <Text>Breadth: {item.breadthInches} inches</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between' }}>
              <Text>Height: {item.heightInches} inches</Text>
              <Text>Quantity: {item.quantity}</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between' }}>
              <Text>Result: {parseFloat(item.result).toFixed(2)}</Text>
              <Text>Total Price: {parseFloat(item.totalPrice).toFixed(2)}</Text>
            </View>
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
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  itemText: {
    fontSize: 16,
  },
});
