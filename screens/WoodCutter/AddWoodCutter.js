import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ref, push, serverTimestamp, set } from 'firebase/database'; // Import set method
import { database } from '../../Firebase/FirebaseConfig';

export default function AddWoodCutter({ route ,navigation}) {
  const { key } = route.params;

  // State variables to store name and salary per day
  const [name, setName] = useState('');


  // Function to add worker data to the database
  const addWorkerToDatabase = () => {
    // Validate input fields
    if (!name ) {
      alert('Please enter both name and salary per day');
      return;
    }

    // Push data to Firebase database
    const workerRef = ref(database, `Mills/${key}/WoodCutter`);
    const newWorkerRef = push(workerRef);
    // Use set method to set the data at the newly generated reference
    set(newWorkerRef, {
      name: name,
      timestamp: serverTimestamp()
    }).then(() => {
      // Data added successfully
      console.log('Worker added to database');
      navigation.navigate('Home')
      // You can navigate to another screen or perform other actions here if needed
    }).catch((error) => {
      console.error('Error adding worker to database: ', error);
    });
  };

  return (
    <View style={styles.container}>
      {/* Name input */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={text => setName(text)}
      />
      {/* Salary per day input */}
    
      {/* Touchable opacity to add data */}
      <TouchableOpacity style={styles.button} onPress={addWorkerToDatabase}>
        <Text style={styles.buttonText}>Add Worker</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
