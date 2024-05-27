import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

export default function FlatLogCalculator({ route,navigation }) {
  const [lengthFeet, setLengthFeet] = useState('');
  const [breadthInches, setBreadthInches] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [calculationHistory, setCalculationHistory] = useState([]);

  const handleCalculation = () => {
    const resultValue = (lengthFeet / 12) * breadthInches * heightInches * quantity;
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
    <View style={{display:'flex',flexDirection:'row',paddingHorizontal:10,justifyContent:'space-between'}}>
    <Text>Length: {item.lengthFeet} feet</Text>
    <Text>Breadth: {item.breadthInches} inches</Text>
    </View>
    <View style={{display:'flex',flexDirection:'row',paddingHorizontal:10,justifyContent:'space-between'}}>
    <Text>Height: {item.heightInches} inches</Text>
    <Text>Quantity: {item.quantity}</Text>
    </View>
    <View style={{display:'flex',flexDirection:'row',paddingHorizontal:10,justifyContent:'space-between'}}>
    <Text>Result: {item.result}</Text>
      <Text>Price: {item.totalPrice}</Text>
      </View>
      
     
      
    </View>
  );

  return (
    <View style={styles.container}>
    <View style={{display:'flex',flexDirection:'row',paddingHorizontal:10}}>
    <Text>Total Area</Text>
    <Text>Total Price</Text>
    <TouchableOpacity style={styles.button} onPress={handleCalculation}>
        <Text>save</Text>
      </TouchableOpacity>
    </View>
      <View style={styles.historyContainer}>
        <FlatList
          data={calculationHistory}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
       
        />
      </View>
      <View style={styles.inputContainer}>
        <View style={{display:'flex',flexDirection:'row',paddingHorizontal:10}}>
          <TextInput
            style={styles.input}
            placeholder="Length (feet)"
            value={lengthFeet}
            onChangeText={(text) => setLengthFeet(text)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Breadth (inches)"
            value={breadthInches}
            onChangeText={(text) => setBreadthInches(text)}
            keyboardType="numeric"
          />
        </View>
        <View style={{display:'flex',flexDirection:'row',paddingHorizontal:10}}>
          <TextInput
            style={styles.input}
            placeholder="Height (inches)"
            value={heightInches}
            onChangeText={(text) => setHeightInches(text)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Quantity"
            value={quantity}
            onChangeText={(text) => setQuantity(text)}
            keyboardType="numeric"
          />
        </View>
        <View style={{display:'flex',flexDirection:'row',paddingHorizontal:10}}>
        <TextInput
        style={styles.input}
        placeholder="Price Per Unit"
        keyboardType="numeric"
        value={pricePerUnit}
        onChangeText={(text) => setPricePerUnit(text)}
      />
         
          <TouchableOpacity style={styles.button} onPress={handleCalculation}>
        <Text>Calculate</Text>
      </TouchableOpacity>
        </View>
        
        
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  historyContainer: {
    flex: 1,
    width: '100%',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    borderWidth:1,
    borderRadius:5
  },
  input: {
    width: 150,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    marginRight: 10,
  },
  button: {
    width: 150,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'lightblue',
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
  },
});
