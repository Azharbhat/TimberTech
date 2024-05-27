import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { ref, push, serverTimestamp, set, get, child, onValue, off, remove } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';

export default function BoxMakerDetail({ route }) {
  const { key, workerKey, data } = route.params;
  const [type, setType] = useState('full');
  const [amount, setAmount] = useState('');
  const [savedData, setSavedData] = useState([]);
  const [error, setError] = useState(null);
  const [fullBoxTotal, setFullBoxTotal] = useState(0);
  const [halfBoxTotal, setHalfBoxTotal] = useState(0);
  const [oneSideTotal, setOneSideTotal] = useState(0);

  // Function to calculate the total amount for each type
  useEffect(() => {
    let fullTotal = 0;
    let halfTotal = 0;
    let oneSideTotal = 0;

    savedData.forEach(item => {
      switch (item.type) {
        case 'full':
          fullTotal += parseInt(item.amount);
          break;
        case 'half':
          halfTotal += parseInt(item.amount);
          break;
        case 'side':
          oneSideTotal += parseInt(item.amount);
          break;
        default:
          break;
      }
    });

    setFullBoxTotal(fullTotal);
    setHalfBoxTotal(halfTotal);
    setOneSideTotal(oneSideTotal);
  }, [savedData]);

  // Fetch data from Firebase when component mounts
  useEffect(() => {
    const dataRef = ref(database, `Mills/${key}/BoxMakers/${workerKey}/Data`);
    const onDataChange = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dataArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setSavedData(dataArray);
      } else {
        setSavedData([]);
      }
    });

    return () => {
      // Unsubscribe from data changes when component unmounts
      off(dataRef, onDataChange);
    };
  }, [key, workerKey]);

  const addDataToDatabase = async () => {
    try {
      // Validate input fields
      if (!type || !amount) {
        alert('Please select type and enter the amount');
        return;
      }

      // Push data to Firebase database
      const dataRef = ref(database, `Mills/${key}/BoxMakers/${workerKey}/Data`);
      const newDataRef = push(dataRef);
      await set(newDataRef, {
        type: type,
        amount: amount,
        timestamp: serverTimestamp()
      });

      // Data added successfully
      console.log('Data added to database');
      // Clear input fields
      setAmount('');
    } catch (error) {
      console.error('Error adding data to database: ', error);
      setError(error);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      // Remove the item from the database
      await remove(ref(database, `Mills/${key}/BoxMakers/${workerKey}/Data/${itemId}`));

      // Update the local state by filtering out the deleted item
      setSavedData(savedData.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item: ', error);
      setError(error);
    }
  };

  const handleDelete = (itemId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteItem(itemId) }
      ],
      { cancelable: false }
    );
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
        <Text style={styles.title}>{data.name}</Text>
        <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
        <Text style={styles.total}>Full Box: {fullBoxTotal}</Text>
        <Text style={styles.total}>{fullBoxTotal * parseInt(data.salaryFullBox)}Rs</Text>
        </View>
        <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
        <Text style={styles.total}>Half Box Total: {halfBoxTotal}</Text>
        <Text style={styles.total}>{halfBoxTotal * parseInt(data.salaryHalfBox)}Rs</Text>
        </View>
        <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
        <Text style={styles.total}>One Side Total: {oneSideTotal}</Text>
        <Text style={styles.total}>{oneSideTotal * parseInt(data.salaryOneSide)}Rs</Text>
        </View>
      </View>
      <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between',paddingHorizontal:10}}>
      <Text style={{color:'chocolate',fontSize:15}}>Type</Text>
      <Text style={{color:'chocolate',fontSize:15}}>Amount</Text>
      <Text style={{color:'chocolate',fontSize:15}}>Date</Text>
      </View>
      <FlatList
        data={savedData}
        keyExtractor={(item, index) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => handleDelete(item.id)}
            style={styles.item}
          >
            <Text style={styles.itemText}>{(item.type).toUpperCase()}</Text>
            <Text style={styles.itemText}>{item.amount}</Text>
            <View>
              <Text style={{}}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
              <Text style={{}}>{new Date(item.timestamp).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <View>
        <View style={styles.inputContainer}>
        <View style={styles.pickerContainer}>
        <Picker
          style={styles.picker}
          selectedValue={type}
          onValueChange={value => setType(value)}>
          <Picker.Item label="Full Box/Paiti" value="full" />
          <Picker.Item label="Half Box/Daba" value="half" />
          <Picker.Item label="One Side/Shoon" value="side" />
        </Picker>
      </View>
      
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.buttonn} onPress={addDataToDatabase}>
            <Text style={styles.buttonText}>Add Data</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Define styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 30,
    color:'#8B4513',
    textAlign:'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Shadow color
    textShadowOffset: { width: 2, height: 2 }, // Shadow offset
    textShadowRadius: 10, // Shadow blur radius
  },
  
  header: {
    paddingTop: 30,
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderRadius: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#8B4513',
    backgroundColor: '#D2B48C',
    textAlign: 'center'
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color:'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Shadow color
    textShadowOffset: { width: 2, height: 2 }, // Shadow offset
    textShadowRadius: 10, // Shadow blur radius
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F5F5DC',
    borderRadius: 5,
    marginBottom: 5,
  },
  itemText: {
    fontSize: 20,
    color: '#8B4513',
  },
  inputContainer: {
    display:'flex',
    flexDirection:'row',
  },
  pickerContainer: {
    height: 40,
    width: '37%',
    backgroundColor: '#8B4513',
    borderRadius: 5,
    overflow: 'hidden', // Ensure the border radius is applied
  },
  picker: {
    height: 40,
    width: '100%', // Ensure the picker takes full width of its container
    fontSize: 10,
    color: 'white', // Change text color if needed
  },
  
  input: {
    height: 40,
    width: '40%',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  buttonn: {
    backgroundColor: '#8B4513',
    paddingHorizontal:10,
    height:40,
    paddingVertical:10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
