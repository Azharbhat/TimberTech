import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, FlatList,Image, StyleSheet } from 'react-native';
import { ref, push, serverTimestamp } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';

export default function FlatLogCalculator({ route, navigation }) {
  const { key } = route.params;

  const [name, setName] = useState('');
  const [results, setResults] = useState([]);
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [lengthFeet, setLengthFeet] = useState('');
  const [breadthInches, setBreadthInches] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  const handleCalculation = () => {
    if (!validateInputs()) {
      return;
    }
    const resultValue = (lengthFeet  * breadthInches * heightInches * quantity)/144;
    const totalPriceValue = resultValue * pricePerUnit;

    const calculationResult = {
      result: resultValue.toString(),
      totalPrice: totalPriceValue.toString(),
      lengthFeet,
      breadthInches,
      heightInches,
      quantity,
      pricePerUnit
    };

    setCalculationHistory([calculationResult, ...calculationHistory]);
    clearInputs();
  };

  const clearInputs = () => {
    setLengthFeet('');
    setBreadthInches('');
    setHeightInches('');
    setQuantity('');
    setPricePerUnit('');
  };

  const renderItem = ({ item }) => (
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
        <Text> Result: {parseFloat(item.result).toFixed(2)}</Text>
        <Text>Total Price: {parseFloat(item.totalPrice).toFixed(2)}</Text>


      </View>
    </View>
  );
  const validateInputs = () => {
    if (!lengthFeet || !breadthInches || !heightInches || !quantity || !pricePerUnit) {
      alert('Please enter all input fields.');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!name) {
      alert('Please enter all input fields before saving.');
      return;
    }
    const timestamp = serverTimestamp();
    const entry = {
      name,
      timestamp,
      data: calculationHistory,
      totalArea: calculateTotalArea(),
      totalPrice:calculateTotalPrice()
    };
    const entryRef = ref(database, `Mills/${key}/FlatLogCalculations`);
    push(entryRef, entry);
    setCalculationHistory([]);
    setName('');
  };

  const calculateTotalArea = () => {
    return calculationHistory.reduce((acc, curr) => acc + parseFloat(curr.result), 0).toFixed(2);
  };

  const calculateTotalPrice = () => {
    return calculationHistory.reduce((acc, curr) => acc + parseFloat(curr.totalPrice), 0).toFixed(2);
  };

  return (
    <View style={styles.container}>
    <View style={{backgroundColor:'rgb(139, 68, 20)',width:'100%',borderBottomLeftRadius:25,borderBottomRightRadius:25}}>
    <View style={{display:'flex',flexDirection:'row',justifyContent:'space-evenly'}}>
    <Text style={styles.title}>FlatLog Calculator</Text>
     <Image source={require('../../assets/flatWood.webp') }  style={styles.image}/ >
    </View>
    <View style={styles.row}>
    <TouchableOpacity onPress={() => { navigation.navigate('FlatLogSaved', { key: key }) }} style={styles.button}>
      <Text style={styles.buttonText}>Saved</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={handleSave} style={styles.button}>
      <Text style={styles.buttonText}>Save</Text>
    </TouchableOpacity>
    <TextInput
      style={[styles.input, focusedInput === 'name' && styles.focusedInput]}
      placeholder="Enter name"
      value={name}
      onChangeText={setName}
      onFocus={() => setFocusedInput('name')}
      onBlur={() => setFocusedInput(null)}
    />
    <TouchableOpacity onPress={() => { setCalculationHistory([]) }} style={styles.button}>
      <Text style={styles.buttonText}>Clear</Text>
    </TouchableOpacity>
  </View>
    

    </View>
   
      
     
      <View style={styles.totalContainer}>
        <Text style={styles.total}>Total Area: {calculateTotalArea()}</Text>
        <Text style={styles.total}>Total Price: {calculateTotalPrice()}</Text>
      </View>
      <View style={styles.historyContainer}>
        <FlatList
          data={calculationHistory}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, focusedInput === 'lengthFeet' && styles.focusedInput]}
            placeholder="Length (feet)"
            value={lengthFeet}
            onChangeText={(text) => setLengthFeet(text)}
            keyboardType="numeric"
            onFocus={() => setFocusedInput('lengthFeet')}
            onBlur={() => setFocusedInput(null)}
          />
          <TextInput
            style={[styles.input, focusedInput === 'breadthInches' && styles.focusedInput]}
            placeholder="Breadth (inches)"
            value={breadthInches}
            onChangeText={(text) => setBreadthInches(text)}
            keyboardType="numeric"
            onFocus={() => setFocusedInput('breadthInches')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, focusedInput === 'heightInches' && styles.focusedInput]}
            placeholder="Height (inches)"
            value={heightInches}
            onChangeText={(text) => setHeightInches(text)}
            keyboardType="numeric"
            onFocus={() => setFocusedInput('heightInches')}
            onBlur={() => setFocusedInput(null)}
          />
          <TextInput
            style={[styles.input, focusedInput === 'quantity' && styles.focusedInput]}
            placeholder="Quantity"
            value={quantity}
            onChangeText={(text) => setQuantity(text)}
            keyboardType="numeric"
            onFocus={() => setFocusedInput('quantity')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, focusedInput === 'pricePerUnit' && styles.focusedInput]}
            placeholder="Price Per Unit"
            keyboardType="numeric"
            value={pricePerUnit}
            onChangeText={(text) => setPricePerUnit(text)}
            onFocus={() => setFocusedInput('pricePerUnit')}
            onBlur={() => setFocusedInput(null)}
          />
          <TouchableOpacity style={styles.buttonn} onPress={handleCalculation}>
            <Text style={styles.buttonText}>Calculate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC', // Wooden theme color
  },
  title: {
    textAlign: 'center',
    fontSize: 25,
    color: 'white',
    marginVertical: 25,
    fontFamily: 'sans-serif',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
  },
  input: {
    height: 40,
    width: 150,

    fontWeight:'500',
    fontSize:20,
    borderColor: 'gray',
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  button: {
    backgroundColor: 'brown',
    width: '18%',
    height: 40,
    paddingVertical: 9,
    borderRadius: 10,
  },
  buttonn: {
    backgroundColor: 'brown',
    width: '44%',
    height: 40,
    paddingVertical: 9,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5, // This is for Android only
  },
  
  buttonText: {
    textAlign: 'center',
    fontSize: 15,
    color: 'white',
    fontFamily: 'sans-serif',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  total: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  historyContainer: {
    flex: 1,
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 5,
    width: '90%',
    paddingHorizontal: 5,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  item: {
    backgroundColor: 'rgb(214, 196, 179)',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  focusedInput: {
    borderColor: 'red', // Change this to whatever color you want for focused input
  },
  image: {
    width: 80, // Adjust width as needed
    height: 80, // Adjust height as needed
    resizeMode: 'contain', // Adjust resizeMode as needed
  },
  
});
