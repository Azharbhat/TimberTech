// Import necessary components
import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, Text, TextInput, TouchableOpacity, BackHandler, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { ref, push, serverTimestamp, set, get, child, onValue, off } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BoxMakerDetail({ route, navigation }) {
  const [type, setType] = useState('full');
  const [amount, setAmount] = useState('');
  const [savedData, setSavedData] = useState([]);
  const [error, setError] = useState(null);
  const [fullBoxTotal, setFullBoxTotal] = useState(0);
  const [halfBoxTotal, setHalfBoxTotal] = useState(0);
  const [oneSideTotal, setOneSideTotal] = useState(0);
  const [workerKey, setWorkerKey] = useState(null);
  const [key, setKey] = useState(null); // Added key state
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('TimberTechBoxmaker');
        if (userData !== null) {
          const { userId, title, millId } = JSON.parse(userData);
          setWorkerKey(userId);
          console.log(userId, millId);
          setKey(millId); // Set the key state
          fetchDataForUserId(userId);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
      off(dataRef, onDataChange);
    };
  }, [key, workerKey]);

  const addDataToDatabase = async () => {
    try {
      if (!type || !amount) {
        alert('Please select type and enter the amount');
        return;
      }

      const dataRef = ref(database, `Mills/${key}/BoxMakers/${workerKey}/Data`);
      const newDataRef = push(dataRef);
      await set(newDataRef, {
        type: type,
        amount: amount,
        timestamp: serverTimestamp()
      });

      setType('');
      setAmount('');
    } catch (error) {
      console.error('Error adding data to database: ', error);
      setError(error);
    }
  };
 

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('TimberTechBoxmaker');
      BackHandler.exitApp();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const dataRef = ref(database, `Mills/${key}/BoxMakers/${workerKey}`);
    const onDataChange = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setData(data);
      } else {
        setData(null);
      }
    });

    return () => {
      off(dataRef, onDataChange);
    };
  }, [key, workerKey]);

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
        </View>
      )}
      {!isLoading && data && (
        <>
          <View style={styles.header}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{data.name}</Text>
              <TouchableOpacity onPress={() => { navigation.navigate('Worker', { title: 'BoxMaker' }) }}>
                <Text style={styles.Account}>Account</Text>
              </TouchableOpacity>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.total}>Full Box: {fullBoxTotal}</Text>
              <Text style={styles.total}>{fullBoxTotal * parseInt(data.salaryFullBox)}Rs</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.total}>Half Box Total: {halfBoxTotal}</Text>
              <Text style={styles.total}>{halfBoxTotal * parseInt(data.salaryHalfBox)}Rs</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.total}>One Side Total: {oneSideTotal}</Text>
              <Text style={styles.total}>{oneSideTotal * parseInt(data.salaryOneSide)}Rs</Text>
            </View>
          </View>
          <FlatList
            data={savedData}
            keyExtractor={(item, index) => item.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.itemText}>{item.type}</Text>
                <Text style={{}}>{new Date(item.timestamp).toLocaleString()}</Text>
                <Text style={styles.itemText}>{item.amount}</Text>
              </View>
            )}
          />
          <View>
            <View style={styles.inputContainer}>
              <Picker
                style={styles.picker}
                selectedValue={type}
                onValueChange={value => setType(value)}>
                <Picker.Item label="Full Box/Paiti" value="full" />
                <Picker.Item label="Half Box/Daba" value="half" />
                <Picker.Item label="One Side/Shoon" value="side" />
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
        </>
      )}
      {!isLoading && !data && (
        <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',paddingTop:'90%' }}>
          <Text style={{ fontSize: 30, textAlign: 'center' }}>No Data Found</Text>
          <TouchableOpacity style={{ width: 100, backgroundColor: 'red', padding: 10, justifyContent: 'center' ,borderRadius:5,marginTop:10}} onPress={handleLogout}>
            <Text style={{ textAlign: 'center' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
      
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
    fontSize: 25,
    fontWeight: 'bold',
    color: '#8B4513',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  header: {
    paddingTop: 30,
    paddingVertical: 10,
    display: 'flex',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderRadius: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#8B4513',
    backgroundColor: '#D2B48C',
    textAlign: 'center'
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
  logoutButton: {
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
    width: 'auto'
  },
  Account: {
    backgroundColor: 'green',
    padding: 5,
    borderRadius: 5,
    width: 'auto'
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
