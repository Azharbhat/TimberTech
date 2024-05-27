import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ref, push, serverTimestamp, set } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { Picker } from '@react-native-picker/picker';

export default function AddWorker({ route, navigation }) {
  const { key } = route.params;

  const [name, setName] = useState('');
  const [salaryPerDay, setSalaryPerDay] = useState('');
  const [salaryFullBox, setSalaryFullBox] = useState('');
  const [salaryHalfBox, setSalaryHalfBox] = useState('');
  const [salaryOneSide, setSalaryOneSide] = useState('');
  const [workerType, setWorkerType] = useState('Normal');

  const addWorkerToDatabase = () => {
    if (!name || (workerType === 'Boxmaker' && (!salaryFullBox || !salaryHalfBox || !salaryOneSide))) {
      alert('Please enter all fields');
      return;
    }

    const workerRef = ref(database, `Mills/${key}/Workers`);
    const newWorkerRef = push(workerRef);
    const workerData = {
      name: name,
      type: workerType,
      ...(workerType === 'Normal' && { salaryPerDay: salaryPerDay }),
      ...(workerType === 'Boxmaker' && {
        salaryFullBox: salaryFullBox,
        salaryHalfBox: salaryHalfBox,
        salaryOneSide: salaryOneSide
      }),
      timestamp: serverTimestamp()
    };
    set(newWorkerRef, workerData).then(() => {
      console.log('Worker added to database');
      if (workerType === 'Boxmaker') {
        const boxMakerRef = ref(database, `Mills/${key}/BoxMakers/${newWorkerRef.key}`);
        set(boxMakerRef, workerData).then(() => {
          console.log('Box Maker added to database');
          navigation.navigate('Home');
        }).catch((error) => {
          console.error('Error adding Box Maker to database: ', error);
        });
      } else {
        navigation.navigate('Home');
      }
    }).catch((error) => {
      console.error('Error adding worker to database: ', error);
    });
  };

  return (
    <View style={styles.container}>
      
      <Picker
        selectedValue={workerType}
        style={styles.input}
        onValueChange={(itemValue, itemIndex) => setWorkerType(itemValue)}
      >
        <Picker.Item label="Normal" value="Normal" />
        <Picker.Item label="Boxmaker" value="Boxmaker" />
      </Picker>
      {workerType === 'Normal' &&
      <><TextInput
      style={styles.input}
      placeholder="Name"
      value={name}
      onChangeText={text => setName(text)}
    />
    <TextInput
    style={styles.input}
    placeholder="Salary per day"
    value={salaryPerDay}
    onChangeText={text => setSalaryPerDay(text)}
    keyboardType="numeric"
  />
      </>
       
      }
      {workerType === 'Boxmaker' &&
        <>
        <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={text => setName(text)}
      />
          <TextInput
            style={styles.input}
            placeholder="Price for full box"
            value={salaryFullBox}
            onChangeText={text => setSalaryFullBox(text)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Price for half box"
            value={salaryHalfBox}
            onChangeText={text => setSalaryHalfBox(text)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Price for one side"
            value={salaryOneSide}
            onChangeText={text => setSalaryOneSide(text)}
            keyboardType="numeric"
          />
        </>
      }
      
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
