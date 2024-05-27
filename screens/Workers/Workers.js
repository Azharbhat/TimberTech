import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function Workers({ route, navigation }) {
  const { key, name } = route.params;

  const [savedResults, setSavedResults] = useState([]);
  const [workerKeys, setWorkerKeys] = useState([]);
  const [error, setError] = useState(null);
  const [showAddWorker, setShowAddWorker] = useState(false); // State to manage showing/hiding add worker button
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${key}/Workers`));
        if (snapshot.exists()) {
          const keys = [];
          snapshot.forEach((childSnapshot) => {
            const workerKey = childSnapshot.key;
            keys.push(workerKey);
          });
          setWorkerKeys(keys);

          const data = snapshot.val();
          const results = data ? Object.values(data) : [];
          setSavedResults(results);
        } else {
          setSavedResults([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
      }
    };

    fetchData();

    return () => {
      // Clean up any listeners or subscriptions
    };
  }, [key]);

  const handleItemPress = (item, workerKey) => {
    navigation.navigate('WorkerDetail', { key: key, workerKey: workerKey, data: item });
    setShowAddWorker(false)
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity onPress={() => setShowAddWorker(!showAddWorker)}>
          <Ionicons name="ellipsis-vertical" size={30} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {showAddWorker && (
        <View style={styles.tab}>

          <TouchableOpacity onPress={() => { navigation.navigate('AddWorker', { key: key }),setShowAddWorker(false) }}>
            <Text style={styles.addWorkerButtonn}>Add Worker</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { navigation.navigate('DeleteWorker', { key: key, address: 'Workers' }) ,setShowAddWorker(false)}}>
            <Text style={styles.addWorkerButtonn}>Delete Worker</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { navigation.navigate('CopyId', { key: key, address: 'Workers' }),setShowAddWorker(false) }}>
            <Text style={styles.addWorkerButtonn}>Get Id's</Text>
          </TouchableOpacity>
        </View >
      )}

      <FlatList
        data={savedResults}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => handleItemPress(item, workerKeys[index])}>
            <View style={[styles.item, item.type === 'Boxmaker' && styles.boxmakerItem]}>
              <Text style={styles.itemText}>{item.name}</Text>
              {item.type === 'Boxmaker' && <Ionicons name="cube-outline" size={24} color="#8B4513" />}
              {item.type === 'Normal' && <Ionicons name="person-outline" size={24} color="#8B4513" />}
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8DC', // Ivory color background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  header: {
    paddingTop: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderRadius: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#8B4513', // Wooden color border bottom
    paddingBottom: 5,
    backgroundColor: '#D2B48C',
    textAlign: 'center'
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingVertical:20,
    backgroundColor: '#F5F5DC', // Beige color background
    marginBottom: 5,
    borderRadius: 5,
  },
  itemText: {
    fontSize: 20,
    color: '#8B4513', // Wooden color text
  },
  addWorkerButton: {
    fontSize: 20,
    color: '#8B4513',
    textAlign: 'center',
    marginVertical: 10,
  },
  addWorkerButtonn: {
    fontSize: 20,
    color: '#FFFFFF', // White text color for buttons
    textAlign: 'center',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  tab: {
    position: 'absolute',
    top: 68, // Adjust top position according to your layout
    right: 0,
    height: 'auto', // Height adjusts based on content
    backgroundColor: '#8B4513',
    width: '50%',
    paddingHorizontal: 10, // Add padding for better visual appearance
    zIndex: 1
  },
  boxmakerItem: {
    backgroundColor: '#FFFFE0', // Light yellow color background for Boxmaker type
  },
});
