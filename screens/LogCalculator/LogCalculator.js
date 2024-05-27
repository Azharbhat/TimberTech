import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity,ImageBackground, Image,FlatList, StyleSheet, } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ref, push, serverTimestamp } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { BackgroundImage } from 'react-native-elements/dist/config';

const LogCalculator = ({ route,navigation }) => {
  const { key } = route.params;

  const [name, setName] = useState('');
  const [num1, setNum1] = useState('');
  const [selectedValue, setSelectedValue] = useState('3.6');
  const [results, setResults] = useState([]);

  const handleCalculate = () => {
    if(num1.length === 0) {
        alert('Please enter a number');
        return;
    }

    const sum = (((parseFloat(num1) * parseFloat(num1)) * parseFloat(selectedValue)) / 2304)-0.01;
    
    // Rounding the result down using Math.floor() but retaining two decimal places
    const roundedResult = Math.floor(sum * 100) / 100;

    const newResult = {
        num1: parseFloat(num1),
        selectedValue: parseFloat(selectedValue),
        result: roundedResult.toFixed(2), // Ensuring two decimal places using toFixed(2)
    };
    
    setResults([...results, newResult]);
    setNum1('');
};


  const handleSave = () => {
    if (name === '') {
      alert('Please enter a name before saving.');
      return;
    }
    const timestamp = serverTimestamp();
    const total = results.reduce((acc, curr) => acc + parseFloat(curr.result), 0);
    const entry = {
      name,
      timestamp,
      data: results,
      total,
    };
    const entryRef = ref(database, `Mills/${key}/LogCalculations`);
    push(entryRef, entry);
    setResults([]);
    setName('');
  };

  const calculateTotal = () => {
    return results.reduce((acc, curr) => acc + parseFloat(curr.result), 0).toFixed(2);
  };

  const pickerValues = ['3.6', '5.25', '1.9', '2.6', '6', '7', '8', '9', '10', '11', '12'];

  return (
    <View style={styles.container}>
    <View style={{backgroundColor:'rgb(139, 68, 20)',width:'100%',borderBottomLeftRadius:25,borderBottomRightRadius:25,paddingTop:30}}>
    <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between',width:'100%',paddingHorizontal:10}}>
    <Text style={styles.title}>Log Calculator</Text>
   <Image source={require('../../assets/roundWood.png') }  style={styles.image}/ >
  </View>
    
    <View style={styles.row}>
      <TouchableOpacity onPress={()=>{navigation.navigate('LogSaved',{key:key})}} style={styles.button}>
        <Text style={styles.buttonText}>Saved</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSave} style={styles.button}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Enter name"
        value={name}
        onChangeText={setName}
      />
      
      <TouchableOpacity onPress={()=>{setResults([])}} style={styles.button}>
        <Text style={styles.buttonText}>clear</Text>
      </TouchableOpacity>
    </View>
    

    </View>
    
     
   
      <View style={styles.row}>
        <Text style={styles.header}>Length</Text>
        <Text style={styles.header}>Thickness</Text>
        <Text style={styles.header}>Result</Text>
      </View>
     
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{fontSize:20}}>{item.num1}</Text>
            <Text style={{fontSize:20}}>{item.selectedValue}</Text>
            <Text style={{fontSize:20}}>{item.result}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
     
      <Text style={styles.total}>Total: {calculateTotal()}</Text>
      <View style={styles.row}>
        <Picker
          selectedValue={selectedValue}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedValue(itemValue)}>
          {pickerValues.map((value, index) => (
            <Picker.Item key={index} label={value} value={value} />
          ))}
        </Picker>
        <TextInput
  style={styles.input}
  placeholder="Enter number"
  keyboardType="numeric"
  value={num1}
  onChangeText={(text) => {
    if (/^\d*\.?\d*$/.test(text)) {
      setNum1(text);
    }
  }}
/>

        <TouchableOpacity onPress={handleCalculate} style={styles.button}>
          <Text style={styles.buttonText}>Calculate</Text>
        </TouchableOpacity>
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
    marginTop: 7,
    fontFamily: 'sans-serif',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  header: {
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    width: 150,
    borderColor: 'gray',
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  button: {
    backgroundColor: 'brown',
   width:'18%',
   height:40,
   paddingVertical:9,
   borderRadius:10,

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
  total: {
    marginTop: 10,
    fontWeight: 'bold',
    fontSize:20
  },
  picker: {
    fontSize:20,
    height: 50,
    width: 120,
    marginBottom: 10,
  },
  image: {
    width: 80, // Adjust width as needed
    height: 40, // Adjust height as needed
    resizeMode: 'contain', // Adjust resizeMode as needed
    backgroundColor:'white',
    borderRadius:10
  },
  
});

export default LogCalculator;
