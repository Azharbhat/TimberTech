import React, { useState,useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ref, push, serverTimestamp, set } from 'firebase/database'; // Import set method
import { database } from '../../Firebase/FirebaseConfig';

export default function AddBoxBuyers({ route, navigation }) {
  const { key } = route.params;

  // State variables to store name, paid amount, total amount, full boxes, half boxes, per full box price, and per half box price
  const [name, setName] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [fullBoxes, setFullBoxes] = useState('');
  const [halfBoxes, setHalfBoxes] = useState('');
  const [perFullBoxPrice, setPerFullBoxPrice] = useState('');
  const [perHalfBoxPrice, setPerHalfBoxPrice] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  // Function to calculate total amount based on full boxes, half boxes, per full box price, and per half box price
  const calculateTotalAmount = () => {
    const fullBoxPrice = parseFloat(perFullBoxPrice) || 0;
    const halfBoxPrice = parseFloat(perHalfBoxPrice) || 0;
    const fullBoxCount = parseInt(fullBoxes) || 0;
    const halfBoxCount = parseInt(halfBoxes) || 0;
  
    const total = fullBoxCount * fullBoxPrice + halfBoxCount * halfBoxPrice;
    setTotalAmount(total.toString());
  };
  
  // Call calculateTotalAmount whenever fullBoxes, halfBoxes, perFullBoxPrice, or perHalfBoxPrice changes
  useEffect(() => {
    calculateTotalAmount();
  }, [fullBoxes, halfBoxes, perFullBoxPrice, perHalfBoxPrice]);
  
  // Function to add buyer data to the database
  const addBuyerToDatabase = () => {
    // Validate input fields
    if (!name || !paidAmount || !totalAmount || !fullBoxes || !halfBoxes || !perFullBoxPrice || !perHalfBoxPrice) {
      alert('Please fill in all fields');
      return;
    }

    // Push data to Firebase database
    const buyerRef = ref(database, `Mills/${key}/BoxBuyers`);
    const newBuyerRef = push(buyerRef);
    // Use set method to set the data at the newly generated reference
    set(newBuyerRef, {
      name: name,
      paidAmount: paidAmount,
      totalAmount: totalAmount,
      fullBoxes: fullBoxes,
      halfBoxes: halfBoxes,
      perFullBoxPrice: perFullBoxPrice,
      perHalfBoxPrice: perHalfBoxPrice,
      timestamp: serverTimestamp(),
    })
      .then(() => {
        // Data added successfully
        console.log('Buyer added to database');
        navigation.navigate('Home');
        // You can navigate to another screen or perform other actions here if needed
      })
      .catch((error) => {
        console.error('Error adding buyer to database: ', error);
      });
  };

  return (
    <View style={styles.container}>
      {/* Name input */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={(text) => setName(text)}
      />
       {/* Per full box price input */}
       <TextInput
       style={styles.input}
       placeholder="Per Full Box Price"
       value={perFullBoxPrice}
       onChangeText={(text) => setPerFullBoxPrice(text)}
       keyboardType="numeric" // To show numeric keyboard
     />
     {/* Per half box price input */}
     <TextInput
       style={styles.input}
       placeholder="Per Half Box Price"
       value={perHalfBoxPrice}
       onChangeText={(text) => setPerHalfBoxPrice(text)}
       keyboardType="numeric" // To show numeric keyboard
     />
      {/* Full boxes input */}
      <TextInput
        style={styles.input}
        placeholder="Full Boxes Quantity "
        value={fullBoxes}
        onChangeText={(text) => setFullBoxes(text)}
        keyboardType="numeric" // To show numeric keyboard
      />
      {/* Half boxes input */}
      <TextInput
        style={styles.input}
        placeholder="Half Boxes Quantity"
        value={halfBoxes}
        onChangeText={(text) => setHalfBoxes(text)}
        keyboardType="numeric" // To show numeric keyboard
      />
      {/* Paid amount input */}
      <TextInput
        style={styles.input}
        placeholder="Paid Amount"
        value={paidAmount}
        onChangeText={(text) => setPaidAmount(text)}
        keyboardType="numeric" // To show numeric keyboard
      />
      {/* Total amount input */}
      <Text>Total Price</Text>
      <TextInput
        style={styles.input}
        placeholder="Total Amount"
        value={totalAmount}
        onChangeText={(text) => setTotalAmount(text)}
        keyboardType="numeric" // To show numeric keyboard
      />
     
     
      {/* Touchable opacity to add data */}
      <TouchableOpacity style={styles.button} onPress={addBuyerToDatabase}>
        <Text style={styles.buttonText}>Add Buyer</Text>
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
