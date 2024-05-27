import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, BackHandler, Alert, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';

export default function Costumer({ route }) {
  const [savedData, setSavedData] = useState([]);
  const [Data, setData] = useState([]);
  const [fullBoxTotal, setFullBoxTotal] = useState(0);
  const [halfBoxTotal, setHalfBoxTotal] = useState(0);
  const [paymentTotal, setpaymentTotal] = useState(0);
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [millId, setMillId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [paidPayment, setPaidPayment] = useState(0);
  const [filterType, setFilterType] = useState('all')

  const paymentSum = () => {
    let sum = 0;
    savedData.forEach(item => {
      if (item.type === 'payment') {
        sum += parseInt(item.amount);
      }
    });
    return sum;
  };
  

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('TimberTechCustomer');
        if (userData !== null) {
          const { userId, title, millId } = JSON.parse(userData);
          setUserId(userId);
          setTitle(title);
          setMillId(millId);
          fetchDataForUserId(userId);
        }
      } catch (error) {
        console.error('Error fetching user data from AsyncStorage:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId !== '') {
      const dataRef = ref(database, `Mills/${millId}/BoxBuyers/${userId}/Data`);
      const onDataChange = onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const dataArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          setSavedData(dataArray);
          saveUserIdToStorage(userId);
        } else {
          setSavedData([]);
        }
        setIsLoading(false); // Set loading to false once data is fetched
      });

      return () => {
        off(dataRef, onDataChange);
      };
    }
  }, [millId, userId]);

  useEffect(() => {
    if (userId !== '') {
      const dataRef = ref(database, `Mills/${millId}/BoxBuyers/${userId}`);
      const onDataChange = onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setData(data)
          saveUserIdToStorage(userId);
        } else {
          setSavedData([]);
        }
        setIsLoading(false); // Set loading to false once data is fetched
      });

      return () => {
        off(dataRef, onDataChange);
      };
    }
  }, [millId, userId]);

  useEffect(() => {
    let fullTotal = 0;
    let halfTotal = 0;
    let paymentTotal = 0;

    savedData.forEach(item => {
      switch (item.type) {
        case 'full':
          fullTotal += parseInt(item.amount);
          break;
        case 'half':
          halfTotal += parseInt(item.amount);
          break;
        case 'Payment':
          paymentTotal += parseInt(item.amount);
          break;
        default:
          break;
      }
    });

    setFullBoxTotal(fullTotal);
    setHalfBoxTotal(halfTotal);
    setpaymentTotal(paymentTotal);
  }, [savedData]);

  const fetchDataForUserId = (userId) => {
    setUserId(userId);
  };

  const saveUserIdToStorage = async (userId) => {
    try {
      const userData = JSON.stringify({ userId, title, millId });
      await AsyncStorage.setItem('TimberTechCustomer', userData);
    } catch (e) {
      console.error('Error saving user ID to AsyncStorage:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('TimberTechCustomer');
      BackHandler.exitApp();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  return (
    <View style={styles.container}>
   
   
    <View style={styles.header}>
    <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between',paddingTop:20,paddingHorizontal:10,paddingBottom:10}}>
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
    <Text style={styles.logoutText}>Logout</Text>
  </TouchableOpacity>
  <Text style={styles.title}>{Data.name}</Text>
  </View>
    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={styles.total}>Full Box: {Data.fullBoxes}</Text>
      <Text style={styles.total}>Delivered: {fullBoxTotal}</Text>
      <Text style={styles.total}>Balance:{parseInt(Data.fullBoxes) - parseInt(fullBoxTotal)}</Text>
    </View>
    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={styles.total}>Half Box: {Data.halfBoxes}</Text>
      <Text style={styles.total}>Delivered: {halfBoxTotal}</Text>
      <Text style={styles.total}>Balance:{parseInt(Data.halfBoxes) - parseInt(halfBoxTotal)}</Text>
    </View>
    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={styles.total}>Total Rs: {Data.totalAmount}</Text>
      <Text style={styles.total}>Paid: {paymentTotal}</Text>
      <Text style={styles.total}>Balance:{(Data.totalAmount) - parseInt(paymentTotal)}</Text>
    </View>
   
 
      </View>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between',paddingHorizontal:10 ,borderBottomWidth:1}}>
      <Text style={{fontSize:20,fontWeight:'500'}}>Type</Text>
      <Text style={{fontSize:20,fontWeight:'500'}}>Date</Text>
      <Text style={{fontSize:20,fontWeight:'500'}}>Amount</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#8B4513" />
      ) : userId ? (
        
        <FlatList
          data={savedData}
          keyExtractor={(item, index) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={{width:80}}>{item.type}</Text>
              <Text style={{}}>{(new Date(item.timestamp)).toLocaleString()}</Text>
              <Text style={{width:80}}>{item.amount}</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter User ID"
            value={userId}
            onChangeText={setUserId}
          />
          <TouchableOpacity style={styles.button} onPress={() => fetchDataForUserId(userId)}>
            <Text style={styles.buttonText}>Fetch Data for User ID</Text>
          </TouchableOpacity>
        </View>
      )}
      {!isLoading && !savedData && (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    backgroundColor: '#8B4513', // Added background color
    padding: 10, // Added padding
    borderRadius: 5, // Added border radius
    display:'flex',
    flexDirection:'r'
  },
  title: {
    fontSize: 24,
    paddingTop:10,
    paddingRight:20,
    fontWeight: 'bold',
    color: 'white', // Changed text color to white
  },
  total: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white', // Changed text color to white
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
  item: {
    paddingHorizontal:10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    width: 80,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
