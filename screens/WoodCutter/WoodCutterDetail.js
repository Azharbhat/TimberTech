import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { ref, push, serverTimestamp, set, get, child, onValue, off, remove } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function WoodCutterDetail({ route }) {
  const { key, workerKey, data } = route.params;
  const [savedData, setSavedData] = useState([]);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [place, setPlace] = useState('');
  const [feetCut, setFeetCut] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [payment, setPayment] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  // Fetch data from Firebase when component mounts
  useEffect(() => {
    const dataRef = ref(database, `Mills/${key}/WoodCutter/${workerKey}/Data`);
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

  // Calculate total earned, total paid, and balance
  const totalEarned = savedData.reduce((acc, item) => acc + parseFloat(item.totalPrice), 0);
  const totalPaid = savedData.reduce((acc, item) => acc + parseFloat(item.payment), 0);
  const balance = totalEarned - totalPaid;

  const addDataToDatabase = async () => {
    try {
      // Validate input fields
      if (!date || !place || !feetCut || !totalPrice || !payment) {
        alert('Please fill in all the fields');
        return;
      }
  
      // Push data to Firebase database
      const dataRef = ref(database, `Mills/${key}/WoodCutter/${workerKey}/Data`);
      const newDataRef = push(dataRef);
      await set(newDataRef, {
        timestamp: serverTimestamp(),
        date: date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        place: place,
        feetCut: feetCut,
        totalPrice: totalPrice * feetCut, // Assuming you want to multiply totalPrice by feetCut
        PricePerFeet: totalPrice,
        payment: payment
      });
  
      // Data added successfully
      console.log('Data added to database');
      
      // Clear input fields
      setDate(new Date());
      setPlace('');
      setFeetCut('');
      setTotalPrice('');
      setPayment('');
    } catch (error) {
      console.error('Error adding data to database: ', error);
      setError(error);
    }
  };

  const deleteItem = async (itemId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              // Remove the item from Firebase database
              await remove(ref(database, `Mills/${key}/WoodCutter/${workerKey}/Data/${itemId}`));
              console.log('Item deleted successfully');
            } catch (error) {
              console.error('Error deleting item: ', error);
              setError(error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.name}</Text>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.total}>Total Earned: {totalEarned}</Text>
          <Text style={styles.total}>Paid: {totalPaid}</Text>
          <Text style={styles.total}>Balance: {balance}</Text>
        </View>
      </View>

      <FlatList
        data={savedData}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => deleteItem(item.id)}
          >
            <View style={styles.item}>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text>Date: {item.date}</Text>
                <Text>Place: {item.place}</Text>
                
              </View>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>Price Per Feet: {item.PricePerFeet}</Text>
              <Text>Feet Cut: {item.feetCut}</Text>
              </View>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
               
                <Text>Total Price: {item.totalPrice}</Text>
                <Text>Payment:{item.payment}</Text>
                <Text>Balance:{item.totalPrice-item.payment}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
        <TouchableOpacity style={[styles.input, focusedInput === 'place' && styles.focusedInput]} onPress={() => setShowDatePicker(true)}>
        <Text >
          {date ? formatDate(date) : 'Select Date'}
        </Text>
      </TouchableOpacity>
      
          <TextInput
            style={[styles.input, focusedInput === 'place' && styles.focusedInput]}
            placeholder="Place"
            value={place}
            onChangeText={(text) => setPlace(text)}
            onFocus={() => setFocusedInput('place')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, focusedInput === 'feetCut' && styles.focusedInput]}
            placeholder="No of feet cut"
            value={feetCut}
            onChangeText={(text) => setFeetCut(text)}
            keyboardType="numeric"
            onFocus={() => setFocusedInput('feetCut')}
            onBlur={() => setFocusedInput(null)}
          />
          <TextInput
            style={[styles.input, focusedInput === 'totalPrice' && styles.focusedInput]}
            placeholder="Price Per Feet"
            value={totalPrice}
            onChangeText={(text) => setTotalPrice(text)}
            keyboardType="numeric"
            onFocus={() => setFocusedInput('totalPrice')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, focusedInput === 'payment' && styles.focusedInput]}
            placeholder="Payment"
            value={payment}
            onChangeText={(text) => setPayment(text)}
            keyboardType="numeric"
            onFocus={() => setFocusedInput('payment')}
            onBlur={() => setFocusedInput(null)}
          />
          <TouchableOpacity style={styles.button} onPress={addDataToDatabase}>
            <Text style={styles.buttonText}>Add Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onChangeDate}
        />
      )}
    </View>
  );
}

// Define styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingBottom: 5,
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
  inputContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 5,
    width: '90%',
    paddingHorizontal: 5,
    marginHorizontal:20
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  input: {
    height: 40,
    width: '48%',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  focusedInput: {
    borderColor: 'blue',
  },
  button: {
    backgroundColor: '#8B4513',
    width: '48%',
    height: 42,
    paddingVertical: 9,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign:'center'
  },
  item: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    padding: 10,
  },
});
