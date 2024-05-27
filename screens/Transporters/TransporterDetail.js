import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { ref, push, serverTimestamp, set, onValue, off } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';

export default function TransporterDetail({ route }) {
  const { key, workerKey, data } = route.params;
  const [inputType, setInputType] = useState('logDelivery');
  const [savedData, setSavedData] = useState([]);
  const [error, setError] = useState(null);
  const [destination, setDestination] = useState('');
  const [to, setTo] = useState('');
  const [toFull, setToFull] = useState(true);
  const [toHalf, setToHalf] = useState(false);
  const [from, setFrom] = useState('');
  const [where, setWhere] = useState('');
  const [costs, setCosts] = useState('');
  const [paidFair, setPaidFair] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [fullQuantity, setFullQuantity] = useState('');
  const [halfQuantity, setHalfQuantity] = useState('');
  const calculateTotalCosts = (data) => {
    return data.reduce((total, item) => {
      return total + parseFloat(item.costs || 0);
    }, 0);
  };

  // Function to calculate total paid fair
  const calculateTotalPaidFair = (data) => {
    return data.reduce((total, item) => {
      return total + parseFloat(item.paidFair || 0);
    }, 0);
  };


  useEffect(() => {
    const dataRef = ref(database, `Mills/${key}/Transporters/${workerKey}/Data`);
    const onDataChange = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dataArray = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setSavedData(dataArray);
      } else {
        setSavedData([]);
      }
    });

    return () => {
      off(dataRef, onDataChange);
    };
  }, [key, workerKey]);

  const addDataToDatabase = async () => {
    try {
      const timestamp = new Date().getTime(); // Get current timestamp
  
      const dataRef = ref(database, `Mills/${key}/Transporters/${workerKey}/Data`);
      const newDataRef = push(dataRef);
      await set(newDataRef, {
        inputType: inputType,
        destination: destination,
        to: to,
        toFull: toFull,
        toHalf: toHalf,
        from: from,
        where: where,
        costs: costs,
        paidFair: paidFair,
        fullQuantity: fullQuantity,
        halfQuantity: halfQuantity,
        timestamp: timestamp, // Include timestamp in the data
      });
  
      console.log('Data added to database');
      setIsVisible(false);
      setDestination('');
      setToFull(false);
      setToHalf(false);
      setFrom('');
      setWhere('');
      setCosts('');
      setPaidFair('');
      setFullQuantity('');
      setHalfQuantity('');
    } catch (error) {
      console.error('Error adding data to database: ', error);
      setError(error);
    }
  };
  

  // Calculate totalCosts and totalPaidFair
  const totalCosts = calculateTotalCosts(savedData);
  const totalPaidFair = calculateTotalPaidFair(savedData);

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
        <View style={styles.headerr}>
        <View><Text style={styles.headingText}>{data.name}</Text>
        <Text style={styles.balanceText}>Balance: {totalCosts - totalPaidFair}</Text>
        </View>
        <View><Text style={styles.headingText}>Total Fair Costs: {totalCosts}</Text>
        <Text style={styles.balanceText}>Total Paid Fair: {totalPaidFair}</Text>
        </View>
        </View>
   

      {savedData.length > 0 && (
        <FlatList
          data={savedData}
          keyExtractor={(item, index) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
            <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
            <Text>{item.inputType}</Text>
            {item.destination && <Text>Destination: {item.destination}</Text>}
            {item.where && <Text>Destination: {item.where}</Text>}
            {item.from && <Text>From: {item.from}</Text>}
            {item.to && <Text>To: {item.to}</Text>}
            </View>
            
            <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
            {item.fullQuantity && <Text>Full Quantity: {item.fullQuantity}</Text>}
            {item.halfQuantity && <Text>Half Quantity: {item.halfQuantity}</Text>}
            </View>
            <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
            {item.costs && <Text>Fair: {item.costs}</Text>}
            {item.paidFair && <Text>Paid Fair: {item.paidFair}</Text>}
            {item.paidFair && <Text>Balance:{item.costs-item.paidFair}</Text>}
            </View>

            
            <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}></View>
              
             
              <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
              <Text style={{}}>Date</Text>
              <Text style={{}}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
              <Text style={{}}>{new Date(item.timestamp).toLocaleDateString()}</Text>
            </View>
             
             
            </View>
          )}
        />
      )}

      {/* Toggle button to show/hide input fields */}
      <TouchableOpacity style={styles.toggleButton} onPress={() => setIsVisible(!isVisible)}>
        <Text style={styles.toggleButtonText}>{isVisible ? "-" : "+"}</Text>
      </TouchableOpacity>

      {/* Input fields */}
      {isVisible && (
        <>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.checkbox, { backgroundColor: inputType === 'boxDelivery' ? '#8B4513' : '#FFF' }]}
              onPress={() => setInputType('boxDelivery')}
            >
              <Text style={{ color: inputType === 'boxDelivery' ? '#FFF' : '#000' }}>Box Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.checkbox, { backgroundColor: inputType === 'logDelivery' ? '#8B4513' : '#FFF' }]}
              onPress={() => setInputType('logDelivery')}
            >
              <Text style={{ color: inputType === 'logDelivery' ? '#FFF' : '#000' }}>Log Delivery</Text>
            </TouchableOpacity>
          </View>

          {inputType === 'boxDelivery' ? (
            <>
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, { backgroundColor: toFull ? '#8B4513' : '#FFF' }]}
                  onPress={() => setToFull(!toFull)}
                >
                  <Text style={{ color: toFull ? '#FFF' : '#000' }}>Full</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.checkbox, { backgroundColor: toHalf ? '#8B4513' : '#FFF' }]}
                  onPress={() => setToHalf(!toHalf)}
                >
                  <Text style={{ color: toHalf ? '#FFF' : '#000' }}>Half</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Destination"
                value={destination}
                onChangeText={setDestination}
              />
              <TextInput
                style={styles.input}
                placeholder="To"
                value={to}
                onChangeText={setTo}
              />
              {toFull && (
                <TextInput
                  style={styles.input}
                  placeholder="Full Quantity"
                  value={fullQuantity}
                  onChangeText={setFullQuantity}
                  keyboardType="numeric"
                />
              )}
              {toHalf && (
                <TextInput
                  style={styles.input}
                  placeholder="Half Quantity"
                  value={halfQuantity}
                  onChangeText={setHalfQuantity}
                  keyboardType="numeric"
                />
              )}
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="From"
                value={from}
                onChangeText={setFrom}
              />
              <TextInput
                style={styles.input}
                placeholder="Where"
                value={where}
                onChangeText={setWhere}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Costs"
            value={costs}
            onChangeText={setCosts}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Paid Fair"
            value={paidFair}
            onChangeText={setPaidFair}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button} onPress={addDataToDatabase}>
            <Text style={styles.buttonText}>Add Data</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  headerr: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingTop: 30,
    paddingHorizontal: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceText: {
    color: '#FFF',
  },
  item: {
    backgroundColor: '#F5F5DC',
    borderRadius: 5,
    marginBottom: 10,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  checkbox: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 5,
    marginRight: 10,
  },
  toggleButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 10,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
