import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { ref, push, serverTimestamp, set, get, child, onValue, off } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';

export default function BoxBuyerDetail({ route }) {
  const { key, workerKey, data } = route.params;
  const [type, setType] = useState('full');
  const [amount, setAmount] = useState('');
  const [savedData, setSavedData] = useState([]);
  const [error, setError] = useState(null);
  const [fullBoxTotal, setFullBoxTotal] = useState(0);
  const [halfBoxTotal, setHalfBoxTotal] = useState(0);
  const [oneSideTotal, setOneSideTotal] = useState(0);
  const [paidPayment, setPaidPayment] = useState(0);
  const [filterType, setFilterType] = useState('all'); // New state for filter type

  // Function to calculate the total amount for each type
  useEffect(() => {
    let fullTotal = 0;
    let halfTotal = 0;
    let oneSideTotal = 0;
    let paidPayment = 0;

    savedData.forEach(item => {
      switch (item.type) {
        case 'full':
          fullTotal += parseInt(item.amount);
          break;
        case 'half':
          halfTotal += parseInt(item.amount);
          break;
        case 'one_side':
          oneSideTotal += parseInt(item.amount);
          break;
        case 'Payment':
          paidPayment += parseInt(item.amount);
          break;
        default:
          break;
      }
    });

    setFullBoxTotal(fullTotal);
    setHalfBoxTotal(halfTotal);
    setOneSideTotal(oneSideTotal);
    setPaidPayment(paidPayment);
  }, [savedData]);

  // Fetch data from Firebase when component mounts
  useEffect(() => {
    const dataRef = ref(database, `Mills/${key}/BoxBuyers/${workerKey}/Data`);
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
      const dataRef = ref(database, `Mills/${key}/BoxBuyers/${workerKey}/Data`);
      const newDataRef = push(dataRef);
      await set(newDataRef, {
        type: type,
        amount: amount,
        timestamp: serverTimestamp()
      });

      // Data added successfully
      console.log('Data added to database');
      // Clear input fields
      setType('');
      setAmount('');
    } catch (error) {
      console.error('Error adding data to database: ', error);
      setError(error);
    }
  };

  const filteredData = savedData.filter(item => {
    if (filterType === 'all') {
      return true;
    
    } 
    else if(filterType === 'Boxes'){
      return item.type === 'full'||item.type === 'half';
    }
    else {
      return item.type === filterType;
    }
  });

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
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.total}>Full Box: {data.fullBoxes}</Text>
          <Text style={styles.total}>Delivered: {fullBoxTotal}</Text>
          <Text style={styles.total}>Balance:{parseInt(data.fullBoxes) - parseInt(fullBoxTotal)}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.total}>Half Box: {data.halfBoxes}</Text>
          <Text style={styles.total}>Delivered: {halfBoxTotal}</Text>
          <Text style={styles.total}>Balance:{parseInt(data.halfBoxes) - parseInt(halfBoxTotal)}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.total}>Total Rs: {data.totalAmount}</Text>
          <Text style={styles.total}>Paid: {paidPayment}</Text>
          <Text style={styles.total}>Balance:{parseInt(data.totalAmount) - parseInt(paidPayment)}</Text>
        </View>
       
      </View>
      <Picker
      selectedValue={filterType}
      style={{ height: 50, width: 150 ,marginLeft:'35%'}}
      onValueChange={(itemValue, itemIndex) =>
        setFilterType(itemValue)
      }>
      <Picker.Item label="All" value="all" />
      <Picker.Item label="Payments" value="Payment" />
      <Picker.Item label="Boxes" value="Boxes" />
      <Picker.Item label="Half" value="half" />
      <Picker.Item label="Full" value="full" />
    </Picker>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5 }}>
        <Text style={{ fontSize: 15, color: 'black', fontWeight: 'bold' }}>Type</Text>
        <Text style={{ fontSize: 15, color: 'black', fontWeight: 'bold' }}>Date</Text>
        <Text style={{ fontSize: 15, color: 'black', fontWeight: 'bold' }}>Amount</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 }}>
      
        
      </View>
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.item, item.type === 'Payment' && { backgroundColor: '#E6E6FA' }]}>
            <Text style={styles.itemText}>{item.type}</Text>
            <Text>{new Date(item.timestamp).toLocaleString()}</Text>
            <Text style={styles.itemText}>{item.amount}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
          <Picker
            selectedValue={type}
            style={{ height: 50, width: 150 }}
            onValueChange={(itemValue, itemIndex) =>
              setType(itemValue)
            }>
            <Picker.Item label="Full Box/Paiti" value="full" />
            <Picker.Item label="Half Box/Daba" value="half" />
            <Picker.Item label="Payment" value="Payment" />
          </Picker>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.button} onPress={addDataToDatabase}>
            <Text style={styles.buttonText}>Add Data</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    fontSize: 15,
    fontWeight: 'bold',
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
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'row',
  },
  picker: {
    height: 40,
    width: '37%',
    fontSize: 10
  },
  input: {
    height: 40,
    width: '40%',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
