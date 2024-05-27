import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function Attendance({ route, navigation }) {
  const { key, name } = route.params;
  const [savedResults, setSavedResults] = useState([]);
  const [workerKeys, setWorkerKeys] = useState([]);
  const [error, setError] = useState(null);
  const [showAddWorker, setShowAddWorker] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await get(ref(database, `Mills/${key}/Workers`));
        if (snapshot.exists()) {
          const keys = [];
          const filteredResults = []; // Initialize an array to store filtered results
          snapshot.forEach((childSnapshot) => {
            const workerKey = childSnapshot.key;
            const workerData = childSnapshot.val();
            if (workerData.type === 'Normal') { // Check if worker type is 'Normal'
              keys.push(workerKey);
              filteredResults.push(workerData);
            }
          });
          setWorkerKeys(keys);
          setSavedResults(filteredResults);
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
  

  const markAttendance = async (workerKey, status) => {
    try {
      const date = new Date().toISOString().split('T')[0]; // Get current date
      const updates = {};
      updates[`Mills/${key}/Workers/${workerKey}/attendance/${date}`] = status; // Update attendance status for current date
      await update(ref(database), updates);
      // Refresh data after updating attendance
      const snapshot = await get(ref(database, `Mills/${key}/Workers`));
      if (snapshot.exists()) {
        const keys = [];
        const filteredResults = [];
        snapshot.forEach((childSnapshot) => {
          const workerKey = childSnapshot.key;
          const workerData = childSnapshot.val();
          if (workerData.type === 'Normal') {
            keys.push(workerKey);
            filteredResults.push(workerData);
          }
        });
        setWorkerKeys(keys);
        setSavedResults(filteredResults);
      } else {
        setSavedResults([]);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError(error);
    }
  };
  

  const getButtonColor = (attendanceStatus) => {
    if (!attendanceStatus) {
      return '#FFFF00'; // Yellow color for no attendance
    } else if (attendanceStatus === 'Absent') {
      return '#FF0000'; // Red color for absent
    } else if (attendanceStatus === 'Present') {
      return '#32CD32'; // Green color for present
    }
  };
  

  const handleItemPress = (item, workerKey) => {
    navigation.navigate('AttendanceDetail', { key: key, workerKey: workerKey, data: item });
    setShowAddWorker(false);
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
       
      </View>

      

      <FlatList
        data={savedResults}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => handleItemPress(item, workerKeys[index])}>
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.name}</Text>
              <TouchableOpacity onPress={() => markAttendance(workerKeys[index], 'Absent')}>
                <Text style={[styles.attendanceButton, { backgroundColor: getButtonColor(item.attendance ? item.attendance[new Date().toISOString().split('T')[0]] : '') }]}>A</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => markAttendance(workerKeys[index], 'Present')}>
                <Text style={[styles.attendanceButton, { backgroundColor: getButtonColor(item.attendance ? item.attendance[new Date().toISOString().split('T')[0]] : '') }]}>P</Text>
              </TouchableOpacity>
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
    backgroundColor: '#F5F5DC', // Beige color background
    marginBottom: 5,
    borderRadius: 5,
  },
  itemText: {
    flex: 1,
    fontSize: 20,
    color: '#8B4513', // Wooden color text
  },
  attendanceButton: {
    fontSize: 25,
    color: '#FFFFFF',
    fontWeight:'900',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 10,
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
  }
});
