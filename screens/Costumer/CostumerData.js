import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CostumerData({ route,navigation }) {
  const { title, millId } = route.params;
  const [userId, setUserId] = useState('');
  const [workerType, setWorkerType] = useState('Normal');
  const [titlee,setTitlee]=useState(title)
  const saveUserIdToStorage = async () => {
    try {
      let dataToSave = {};

      switch (titlee) {
        case 'BoxBuyer':
          dataToSave = { userId, title, millId, customerData: 'specific customer data' };
          await AsyncStorage.setItem('TimberTechCustomer', JSON.stringify(dataToSave));
          navigation.navigate('Costumer')
          break;
        case 'Worker':
          dataToSave = { userId, title, millId, workerType };
          await AsyncStorage.setItem('TimberTechWorker', JSON.stringify(dataToSave));
          navigation.navigate('Worker')
          break;
        case 'BoxMaker':
          dataToSave = { userId, title, millId, boxmakerData: 'specific boxmaker data' };
          await AsyncStorage.setItem('TimberTechBoxmaker', JSON.stringify(dataToSave));
          navigation.navigate('BoxMaker')
          break;
        default:
          alert('something error')
      }

      
    } catch (e) {
      console.error('Error saving data to AsyncStorage:', e);
    }
  };
// 
  const handleWorkerTypeSelection = (type) => {
    setWorkerType(type);
    if(type=="BoxMaker"){
      setTitlee(type)
    }
    else if(type=="BoxBuyer"){
      setTitlee(type)
    }
    else{
      setTitlee(title)
    }
  };
  console.log(titlee)
  return (
    <View style={styles.container}>
      {title === 'Worker' && (
        <View style={styles.workerTypeContainer}>
          <TouchableOpacity
            style={[styles.workerTypeButton, workerType === 'Normal' && styles.selectedWorkerType]}
            onPress={() => handleWorkerTypeSelection('Normal')}
          >
            <Text style={styles.workerTypeButtonText}>Worker</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.workerTypeButton, workerType === 'BoxMaker' && styles.selectedWorkerType]}
            onPress={() => handleWorkerTypeSelection('BoxMaker')}
          >
            <Text style={styles.workerTypeButtonText}>BoxMaker</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.workerTypeButton, workerType === 'BoxBuyer' && styles.selectedWorkerType]}
            onPress={() => handleWorkerTypeSelection('BoxBuyer')}
          >
            <Text style={styles.workerTypeButtonText}>BoxBuyer</Text>
          </TouchableOpacity>
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholder="Enter User ID"
        onChangeText={text => setUserId(text)}
        value={userId}
      />
      <TouchableOpacity style={styles.button} onPress={saveUserIdToStorage}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  workerTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  workerTypeButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '30%',
  },
  workerTypeButtonText: {
    fontWeight: 'bold',
  },
  selectedWorkerType: {
    backgroundColor: '#8B4513',
  },
});
